/**
 * Chrome Extension Storage Service
 * Handles persistent storage of encrypted secrets and optionally master password
 */

interface StoredSession {
  version?: number; // Storage format version
  encryptedSecretsFile?: string; // Base64 encoded encrypted data
  encryptedMasterPassword?: string; // Optional: encrypted password for auto-login
  rememberPassword?: boolean; // User preference
  lastAccessed?: number; // Timestamp for session expiry
  expiresAt?: number; // Explicit expiry timestamp
}

const STORAGE_KEY = 'chromepass_session';
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const STORAGE_VERSION = 2; // Increment when storage format changes

class StorageService {
  private isExtensionEnv(): boolean {
    return (
      typeof chrome !== 'undefined' &&
      chrome.storage &&
      chrome.storage.local !== undefined
    );
  }

  /**
   * Save session data to Chrome storage
   */
  async saveSession(data: {
    encryptedSecretsFile?: string;
    masterPassword?: string;
    rememberPassword?: boolean;
    expiresAt?: number;
  }): Promise<void> {
    if (!this.isExtensionEnv()) {
      // In development, use localStorage
      const sessionData: StoredSession = {
        version: STORAGE_VERSION,
        encryptedSecretsFile: data.encryptedSecretsFile,
        encryptedMasterPassword:
          data.masterPassword && data.rememberPassword
            ? await this.encryptPassword(data.masterPassword)
            : undefined,
        rememberPassword: data.rememberPassword,
        lastAccessed: Date.now(),
        expiresAt: data.expiresAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionData));
      return;
    }

    const sessionData: StoredSession = {
      version: STORAGE_VERSION,
      encryptedSecretsFile: data.encryptedSecretsFile,
      encryptedMasterPassword:
        data.masterPassword && data.rememberPassword
          ? await this.encryptPassword(data.masterPassword)
          : undefined,
      rememberPassword: data.rememberPassword,
      lastAccessed: Date.now(),
      expiresAt: data.expiresAt,
    };

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: sessionData }, () => {
        // @ts-expect-error - Chrome runtime.lastError type issue
        if (chrome.runtime.lastError) {
          // @ts-expect-error - Chrome runtime.lastError type issue
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Load session data from Chrome storage
   */
  async loadSession(): Promise<StoredSession | null> {
    if (!this.isExtensionEnv()) {
      // In development, use localStorage
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }

      try {
        const sessionData: StoredSession = JSON.parse(stored);

        // Check for version mismatch or corruption
        if (!sessionData.version || sessionData.version < STORAGE_VERSION) {
          // eslint-disable-next-line no-console
          console.warn('Outdated session format detected, clearing session');
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }

        if (this.isSessionExpired(sessionData)) {
          localStorage.removeItem(STORAGE_KEY);
          return null;
        }
        return sessionData;
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Corrupted session data, clearing:', error);
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.get([STORAGE_KEY], (result) => {
        // @ts-expect-error - Chrome runtime.lastError type issue
        if (chrome.runtime.lastError) {
          // @ts-expect-error - Chrome runtime.lastError type issue
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          try {
            const sessionData: StoredSession = result[STORAGE_KEY];
            if (!sessionData) {
              resolve(null);
              return;
            }

            // Check for version mismatch or corruption
            if (!sessionData.version || sessionData.version < STORAGE_VERSION) {
              // eslint-disable-next-line no-console
              console.warn(
                'Outdated session format detected, clearing session',
              );
              this.clearSession().then(() => resolve(null));
              return;
            }

            if (this.isSessionExpired(sessionData)) {
              resolve(null);
            } else {
              resolve(sessionData);
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.warn('Corrupted session data, clearing:', error);
            this.clearSession().then(() => resolve(null));
          }
        }
      });
    });
  }

  /**
   * Clear stored session data
   */
  async clearSession(): Promise<void> {
    if (!this.isExtensionEnv()) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }

    return new Promise((resolve, reject) => {
      chrome.storage.local.remove([STORAGE_KEY], () => {
        // @ts-expect-error - Chrome runtime.lastError type issue
        if (chrome.runtime.lastError) {
          // @ts-expect-error - Chrome runtime.lastError type issue
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Verify if stored password matches provided password
   */
  /**
   * Encrypt password for storage using device-specific key
   */
  private async encryptPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();

    // Create a device-specific key using navigator.userAgent + timestamp salt
    const deviceInfo = navigator.userAgent + 'chromepass_device_key';
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(deviceInfo),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey'],
    );

    // Derive encryption key
    const salt = encoder.encode('chromepass_password_salt');
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );

    // Generate IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Encrypt password
    const encrypted = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encoder.encode(password),
    );

    // Combine IV + encrypted data and encode as base64
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt stored password using device-specific key
   */
  async decryptStoredPassword(encryptedPassword: string): Promise<string> {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    try {
      // Validate base64 string before decoding
      if (!encryptedPassword || typeof encryptedPassword !== 'string') {
        throw new Error('Invalid encrypted password format');
      }

      // Basic base64 validation
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      if (!base64Regex.test(encryptedPassword)) {
        throw new Error('Encrypted password is not valid base64');
      }

      // Decode base64
      const combined = new Uint8Array(
        atob(encryptedPassword)
          .split('')
          .map((char) => char.charCodeAt(0)),
      );

      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);

      // Validate minimum length (IV + some encrypted data)
      if (combined.length < 13) {
        throw new Error('Encrypted password data too short');
      }

      // Create the same device-specific key
      const deviceInfo = navigator.userAgent + 'chromepass_device_key';
      const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(deviceInfo),
        'PBKDF2',
        false,
        ['deriveBits', 'deriveKey'],
      );

      // Derive decryption key
      const salt = encoder.encode('chromepass_password_salt');
      const key = await crypto.subtle.deriveKey(
        {
          name: 'PBKDF2',
          salt: salt,
          iterations: 100000,
          hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt'],
      );

      // Decrypt password
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv,
        },
        key,
        encrypted,
      );

      return decoder.decode(decrypted);
    } catch (error) {
      // Log error for debugging but don't expose sensitive details
      // eslint-disable-next-line no-console
      console.error(
        'Failed to decrypt stored password:',
        error instanceof Error ? error.message : 'Unknown error',
      );
      throw new Error(
        'Failed to decrypt stored password - session may be corrupted',
      );
    }
  }

  /**
   * Clear all stored data (for troubleshooting)
   */
  async clearAllData(): Promise<void> {
    await this.clearSession();

    if (!this.isExtensionEnv()) {
      // Clear all localStorage items that start with our prefix
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('chromepass_')) {
          localStorage.removeItem(key);
        }
      });
    } else {
      // Clear all Chrome storage
      return new Promise((resolve, reject) => {
        chrome.storage.local.clear(() => {
          // @ts-expect-error - Chrome runtime.lastError type issue
          if (chrome.runtime.lastError) {
            // @ts-expect-error - Chrome runtime.lastError type issue
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve();
          }
        });
      });
    }
  }

  /**
   * Check if session has expired
   */
  private isSessionExpired(sessionData: StoredSession): boolean {
    // Use explicit expiry if available, otherwise fall back to lastAccessed
    if (sessionData.expiresAt) {
      return Date.now() > sessionData.expiresAt;
    }

    if (!sessionData.lastAccessed) {
      return true;
    }

    return Date.now() - sessionData.lastAccessed > SESSION_TIMEOUT;
  }

  /**
   * Update last accessed timestamp
   */
  async updateLastAccessed(): Promise<void> {
    try {
      const session = await this.loadSession();
      if (session) {
        await this.saveSession({
          encryptedSecretsFile: session.encryptedSecretsFile,
          masterPassword: session.encryptedMasterPassword
            ? await this.decryptStoredPassword(session.encryptedMasterPassword)
            : undefined,
          rememberPassword: session.rememberPassword,
          expiresAt: session.expiresAt,
        });
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to update last accessed timestamp:', error);
    }
  }
}

export const storageService = new StorageService();
