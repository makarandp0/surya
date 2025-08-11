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
      const options = {
        masterKey: 'testkey123',
        domain: 'example.com',
        length: 16,
        includeSymbols: false,
      };

      const password1 = await derivePassword(options);
      const password2 = await derivePassword(options);

      expect(password1).toBe(password2);
      expect(password1).toHaveLength(16);
      expect(typeof password1).toBe('string');
    });

    it('generates different passwords for different domains', async () => {
      const baseOptions = {
        masterKey: 'testkey123',
        length: 16,
        includeSymbols: false,
      };

      const password1 = await derivePassword({
        ...baseOptions,
        domain: 'example.com',
      });
      const password2 = await derivePassword({
        ...baseOptions,
        domain: 'google.com',
      });

      expect(password1).not.toBe(password2);
      expect(password1).toHaveLength(16);
      expect(password2).toHaveLength(16);
    });

    it('generates different passwords for different master keys', async () => {
      const baseOptions = {
        domain: 'example.com',
        length: 16,
        includeSymbols: false,
      };

      const password1 = await derivePassword({
        ...baseOptions,
        masterKey: 'key1',
      });
      const password2 = await derivePassword({
        ...baseOptions,
        masterKey: 'key2',
      });

      expect(password1).not.toBe(password2);
    });

    it('respects length parameter', async () => {
      const baseOptions = {
        masterKey: 'testkey123',
        domain: 'example.com',
        includeSymbols: false,
      };

      const password8 = await derivePassword({ ...baseOptions, length: 8 });
      const password12 = await derivePassword({ ...baseOptions, length: 12 });
      const password20 = await derivePassword({ ...baseOptions, length: 20 });
      const password32 = await derivePassword({ ...baseOptions, length: 32 });

      expect(password8).toHaveLength(8);
      expect(password12).toHaveLength(12);
      expect(password20).toHaveLength(20);
      expect(password32).toHaveLength(32);
    });

    it('includes symbols when requested', async () => {
      const options = {
        masterKey: 'testkey123',
        domain: 'example.com',
        length: 16,
        includeSymbols: true,
      };

      const password = await derivePassword(options);
      expect(password).toHaveLength(16);

      // Should contain at least one symbol
      const symbolRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;
      expect(password).toMatch(symbolRegex);
    });

    it('contains only alphanumeric when symbols disabled', async () => {
      const options = {
        masterKey: 'testkey123',
        domain: 'example.com',
        length: 16,
        includeSymbols: false,
      };

      const password = await derivePassword(options);
      expect(password).toHaveLength(16);

      // Should contain only letters and numbers
      const alphanumericRegex = /^[A-Za-z0-9]+$/;
      expect(password).toMatch(alphanumericRegex);
    });

    it('handles various input combinations', async () => {
      const testCases = [
        {
          masterKey: 'short',
          domain: 'a.com',
          length: 8,
          includeSymbols: false,
        },
        {
          masterKey: 'very-long-master-key-with-special-chars!@#',
          domain: 'long-domain-name.co.uk',
          length: 32,
          includeSymbols: true,
        },
        {
          masterKey: '12345',
          domain: 'numbers.org',
          length: 16,
          includeSymbols: false,
        },
        {
          masterKey: 'test key with spaces',
          domain: 'spaces-test.com',
          length: 24,
          includeSymbols: true,
        },
      ];

      for (const testCase of testCases) {
        const password = await derivePassword(testCase);
        expect(password).toHaveLength(testCase.length);
        expect(typeof password).toBe('string');
        expect(password.length).toBeGreaterThan(0);
      }
    });
  });
});
