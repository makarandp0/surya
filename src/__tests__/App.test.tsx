import { describe, it, expect } from 'vitest';

// Import and test the crypto functions directly (core functionality)
import { normalizeDomainFromUrl, derivePassword } from '../crypto';

describe('Core App Functionality', () => {
  describe('normalizeDomainFromUrl', () => {
    it('removes protocol and www prefix', () => {
      expect(normalizeDomainFromUrl('https://www.example.com')).toBe(
        'example.com',
      );
      expect(normalizeDomainFromUrl('http://www.google.com/search')).toBe(
        'google.com',
      );
      expect(normalizeDomainFromUrl('https://subdomain.example.com')).toBe(
        'subdomain.example.com',
      );
    });

    it('handles bare domains', () => {
      expect(normalizeDomainFromUrl('example.com')).toBe('example.com');
      expect(normalizeDomainFromUrl('github.com')).toBe('github.com');
    });

    it('handles localhost and IPs', () => {
      expect(normalizeDomainFromUrl('https://localhost:3000')).toBe(
        'localhost',
      );
      expect(normalizeDomainFromUrl('http://127.0.0.1:8080/path')).toBe(
        '127.0.0.1',
      );
    });

    it('handles edge cases', () => {
      expect(normalizeDomainFromUrl('')).toBe('');
      expect(normalizeDomainFromUrl('invalid')).toBe('invalid');
    });
  });

  describe('derivePassword', () => {
    it('generates deterministic passwords', async () => {
      const secretEntry = {
        name: 'Test',
        secret: '',
        website: 'example.com',
        passwordLength: 16,
        includeSymbols: false,
        salt: 'test-deterministic-salt',
      };

      const password1 = await derivePassword({
        masterKey: 'testkey123',
        secretEntry,
      });
      const password2 = await derivePassword({
        masterKey: 'testkey123',
        secretEntry,
      });

      expect(password1).toBe(password2);
      expect(password1).toHaveLength(16);
      expect(typeof password1).toBe('string');
    });

    it('generates different passwords for different domains', async () => {
      const secretEntry1 = {
        name: 'Test 1',
        secret: '',
        website: 'example.com',
        passwordLength: 16,
        includeSymbols: false,
        salt: 'domain-test-salt-1',
      };

      const secretEntry2 = {
        name: 'Test 2',
        secret: '',
        website: 'google.com',
        passwordLength: 16,
        includeSymbols: false,
        salt: 'domain-test-salt-2',
      };

      const password1 = await derivePassword({
        masterKey: 'testkey123',
        secretEntry: secretEntry1,
      });
      const password2 = await derivePassword({
        masterKey: 'testkey123',
        secretEntry: secretEntry2,
      });

      expect(password1).not.toBe(password2);
      expect(password1).toHaveLength(16);
      expect(password2).toHaveLength(16);
    });

    it('generates different passwords for different master keys', async () => {
      const secretEntry = {
        name: 'Test',
        secret: '',
        website: 'example.com',
        passwordLength: 16,
        includeSymbols: false,
        salt: 'master-key-test-salt',
      };

      const password1 = await derivePassword({
        masterKey: 'key1',
        secretEntry,
      });
      const password2 = await derivePassword({
        masterKey: 'key2',
        secretEntry,
      });

      expect(password1).not.toBe(password2);
    });

    it('respects length parameter', async () => {
      const secretEntry8 = {
        name: 'Test',
        secret: '',
        website: 'example.com',
        passwordLength: 8,
        includeSymbols: false,
        salt: 'length-test-salt',
      };

      const secretEntry12 = {
        name: 'Test',
        secret: '',
        website: 'example.com',
        passwordLength: 12,
        includeSymbols: false,
        salt: 'length-test-salt',
      };

      const secretEntry20 = {
        name: 'Test',
        secret: '',
        website: 'example.com',
        passwordLength: 20,
        includeSymbols: false,
        salt: 'length-test-salt',
      };

      const secretEntry32 = {
        name: 'Test',
        secret: '',
        website: 'example.com',
        passwordLength: 32,
        includeSymbols: false,
        salt: 'length-test-salt',
      };

      const password8 = await derivePassword({
        masterKey: 'testkey123',
        secretEntry: secretEntry8,
      });
      const password12 = await derivePassword({
        masterKey: 'testkey123',
        secretEntry: secretEntry12,
      });
      const password20 = await derivePassword({
        masterKey: 'testkey123',
        secretEntry: secretEntry20,
      });
      const password32 = await derivePassword({
        masterKey: 'testkey123',
        secretEntry: secretEntry32,
      });

      expect(password8).toHaveLength(8);
      expect(password12).toHaveLength(12);
      expect(password20).toHaveLength(20);
      expect(password32).toHaveLength(32);
    });

    it('includes symbols when requested', async () => {
      const secretEntry = {
        name: 'Test',
        secret: '',
        website: 'example.com',
        passwordLength: 16,
        includeSymbols: true,
        salt: 'symbols-test-salt',
      };

      const password = await derivePassword({
        masterKey: 'testkey123',
        secretEntry,
      });
      expect(password).toHaveLength(16);

      // Should contain at least one symbol
      const symbolRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
      expect(password).toMatch(symbolRegex);
    });

    it('contains only alphanumeric when symbols disabled', async () => {
      const secretEntry = {
        name: 'Test',
        secret: '',
        website: 'example.com',
        passwordLength: 16,
        includeSymbols: false,
        salt: 'alphanumeric-test-salt',
      };

      const password = await derivePassword({
        masterKey: 'testkey123',
        secretEntry,
      });
      expect(password).toHaveLength(16);

      // Should contain only letters and numbers
      const alphanumericRegex = /^[A-Za-z0-9]+$/;
      expect(password).toMatch(alphanumericRegex);
    });

    it('handles various input combinations', async () => {
      const testCases = [
        {
          masterKey: 'short',
          secretEntry: {
            name: 'Test 1',
            secret: '',
            website: 'a.com',
            passwordLength: 8,
            includeSymbols: false,
            salt: 'test-case-1-salt',
          },
        },
        {
          masterKey: 'very-long-master-key-with-special-chars!@#',
          secretEntry: {
            name: 'Test 2',
            secret: '',
            website: 'long-domain-name.co.uk',
            passwordLength: 32,
            includeSymbols: true,
            salt: 'test-case-2-salt',
          },
        },
        {
          masterKey: '12345',
          secretEntry: {
            name: 'Test 3',
            secret: '',
            website: 'numbers.org',
            passwordLength: 16,
            includeSymbols: false,
            salt: 'test-case-3-salt',
          },
        },
        {
          masterKey: 'test key with spaces',
          secretEntry: {
            name: 'Test 4',
            secret: '',
            website: 'spaces-test.com',
            passwordLength: 24,
            includeSymbols: true,
            salt: 'test-case-4-salt',
          },
        },
      ];

      for (const testCase of testCases) {
        const password = await derivePassword(testCase);
        expect(password).toHaveLength(testCase.secretEntry.passwordLength);
        expect(typeof password).toBe('string');
        expect(password.length).toBeGreaterThan(0);
      }
    });
  });
});
