// Deterministic password derivation using Web Crypto PBKDF2

const te = new TextEncoder();

const getKeyMaterial = async (masterKey: string): Promise<CryptoKey> => {
  return crypto.subtle.importKey(
    'raw',
    te.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
};

export const normalizeDomainFromUrl = (urlString: string): string => {
  try {
    const url = new URL(urlString);
    let host = url.hostname || '';
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    return host.toLowerCase();
  } catch {
    // Fallback if already a host
    let host = (urlString || '').trim();
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    return host.toLowerCase();
  }
};

const mapBytesToCharset = (
  bytes: Uint8Array,
  length: number,
  opts: { includeSymbols: boolean },
): string => {
  const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const symbols = '!@#$%^&*_-+=:,.?';
  const charset = opts.includeSymbols ? base + symbols : base;
  const out = [];
  let i = 0;
  for (let j = 0; j < length; j++) {
    if (i >= bytes.length) {
      i = 0;
    }
    const idx = bytes[i] % charset.length;
    out.push(charset[idx]);
    i++;
  }
  return out.join('');
};

export const derivePassword = async ({
  masterKey,
  domain,
  username = '',
  length = 16,
  includeSymbols = false,
  iterations = 200000,
}: {
  masterKey: string;
  domain: string;
  username?: string;
  length?: number;
  includeSymbols?: boolean;
  iterations?: number;
}): Promise<string> => {
  if (!masterKey) {
    throw new Error('Missing master key');
  }
  if (!domain) {
    throw new Error('Missing domain');
  }

  const keyMaterial = await getKeyMaterial(masterKey);
  // Include username in the salt for unique passwords per user
  const salt = te.encode(`site:${domain}:${username}`);
  // Derive 64 bytes to have enough entropy for mapping
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    keyMaterial,
    64 * 8,
  );
  const bytes = new Uint8Array(bits);
  return mapBytesToCharset(bytes, length, { includeSymbols });
};

// Base32 decoding for TOTP secret keys
const base32Decode = (encoded: string): Uint8Array => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';

  // Remove padding and convert to uppercase
  encoded = encoded.replace(/=/g, '').toUpperCase();

  for (const char of encoded) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid base32 character');
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    if (bits.length - i >= 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }
  }

  // Create a new Uint8Array from a regular array to ensure we have a clean, detached buffer
  // This avoids potential issues with shared ArrayBuffers in different Node.js environments
  return Uint8Array.from(bytes);
};

// HMAC-SHA1 implementation for TOTP
const hmacSha1 = async (
  key: Uint8Array,
  data: Uint8Array,
): Promise<Uint8Array> => {
  // Ensure we have proper ArrayBuffer instances for Web Crypto API
  // Create new ArrayBuffers and copy the data to avoid any shared buffer issues
  const keyBuffer = new ArrayBuffer(key.length);
  const keyView = new Uint8Array(keyBuffer);
  keyView.set(new Uint8Array(key)); // Ensure we have a proper Uint8Array

  const dataBuffer = new ArrayBuffer(data.length);
  const dataView = new Uint8Array(dataBuffer);
  dataView.set(new Uint8Array(data)); // Ensure we have a proper Uint8Array

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyView, // Use the Uint8Array view, not the ArrayBuffer
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataView); // Use the Uint8Array view
  return new Uint8Array(signature);
};

// Convert number to 8-byte big-endian array
const numberTo8ByteArray = (num: number): Uint8Array => {
  const array = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    array[i] = num & 0xff;
    num = Math.floor(num / 256);
  }
  return array;
};

export const generateTOTP = async ({
  secret,
  digits = 6,
  period = 30,
  timestamp,
}: {
  secret: string;
  digits?: number;
  period?: number;
  timestamp?: number;
}): Promise<{ code: string; timeRemaining: number }> => {
  if (!secret) {
    throw new Error('Missing TOTP secret');
  }
  if (secret.length <= 2) {
    throw new Error('Invalid TOTP secret length');
  }

  const now = timestamp || Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / period);
  const timeRemaining = period - (now % period);

  try {
    // Decode base32 secret
    const secretBytes = base32Decode(secret);

    // Convert counter to 8-byte array
    const counterBytes = numberTo8ByteArray(counter);

    // Generate HMAC
    const hmac = await hmacSha1(secretBytes, counterBytes);

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      Math.pow(10, digits);

    return {
      code: code.toString().padStart(digits, '0'),
      timeRemaining,
    };
  } catch (error) {
    // Enhanced error logging for CI debugging
    throw new Error(
      `Failed to generate TOTP: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
};

// Types for the secrets file
export interface SecretEntry {
  name: string;
  secret: string;
  color?: string;
  passwordLength?: number;
  includeSymbols?: boolean;
  website?: string;
  username?: string;
}

export interface SecretsFile {
  v: number;
  ts: number;
  d: SecretEntry[];
}

// Encrypt secrets file with master password
export const encryptSecretsFile = async (
  secretsFile: SecretsFile,
  masterPassword: string,
): Promise<string> => {
  if (!masterPassword) {
    throw new Error('Master password is required');
  }

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Import key material for PBKDF2
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    te.encode(masterPassword),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'], // Add deriveKey usage
  );

  // Derive key for AES-GCM encryption
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations: 100000,
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt'],
  );

  const data = te.encode(JSON.stringify(secretsFile));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data,
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(
    salt.length + iv.length + encrypted.byteLength,
  );
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  // Return base64 encoded result
  return btoa(String.fromCharCode(...combined));
};

// Decrypt secrets file with master password
export const decryptSecretsFile = async (
  encryptedData: string,
  masterPassword: string,
): Promise<SecretsFile> => {
  if (!masterPassword) {
    throw new Error('Master password is required');
  }
  if (!encryptedData) {
    throw new Error('Encrypted data is required');
  }

  try {
    // Decode base64
    const combined = new Uint8Array(
      atob(encryptedData)
        .split('')
        .map((c) => c.charCodeAt(0)),
    );

    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    // Import key material for PBKDF2
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      te.encode(masterPassword),
      { name: 'PBKDF2' },
      false,
      ['deriveKey'], // Add deriveKey usage
    );

    // Derive the same key
    const key = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        hash: 'SHA-256',
        salt,
        iterations: 100000,
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt'],
    );

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted,
    );

    const text = new TextDecoder().decode(decrypted);
    return JSON.parse(text);
  } catch (_decryptError) {
    // If decryption fails, try parsing as plain JSON (for backward compatibility)
    try {
      const plainFile = JSON.parse(encryptedData);
      if (plainFile.d && Array.isArray(plainFile.d)) {
        return plainFile;
      } else {
        throw new Error('Invalid file format');
      }
    } catch (_parseError) {
      throw new Error('Invalid file format or incorrect password');
    }
  }
};
