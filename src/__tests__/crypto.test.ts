import { describe, it, expect } from 'vitest';
import {
  derivePassword,
  normalizeDomainFromUrl,
  generateTOTP,
  encryptSecretsFile,
  decryptSecretsFile,
  SecretEntry,
} from '../crypto';

describe('normalizeDomainFromUrl', () => {
  it('strips protocol and www, lowercases host', () => {
    expect(normalizeDomainFromUrl('https://www.Example.com/login')).toBe(
      'example.com',
    );
  });

  it('keeps subdomains as provided', () => {
    expect(normalizeDomainFromUrl('Sub.App.Example.com')).toBe(
      'sub.app.example.com',
    );
  });

  it('handles bare host input', () => {
    expect(normalizeDomainFromUrl('www.github.com')).toBe('github.com');
  });
});

describe('derivePassword', () => {
  const masterKey = 'correct horse battery staple';
  const domain = 'example.com';

  it('is deterministic for same inputs', async () => {
    const a = await derivePassword({
      masterKey,
      domain,
      length: 16,
      includeSymbols: false,
      iterations: 10_000,
    });
    const b = await derivePassword({
      masterKey,
      domain,
      length: 16,
      includeSymbols: false,
      iterations: 10_000,
    });
    expect(a).toBe(b);
  });

  it('changes when domain changes', async () => {
    const a = await derivePassword({
      masterKey,
      domain: 'example.com',
      length: 16,
      includeSymbols: false,
      iterations: 10_000,
    });
    const b = await derivePassword({
      masterKey,
      domain: 'example.org',
      length: 16,
      includeSymbols: false,
      iterations: 10_000,
    });
    expect(a).not.toBe(b);
  });

  it('respects length parameter', async () => {
    const short = await derivePassword({
      masterKey,
      domain,
      length: 8,
      includeSymbols: false,
      iterations: 10_000,
    });
    const long = await derivePassword({
      masterKey,
      domain,
      length: 30,
      includeSymbols: false,
      iterations: 10_000,
    });
    expect(short).toHaveLength(8);
    expect(long).toHaveLength(30);
  });

  it('uses only alphanumerics when includeSymbols=false', async () => {
    const pwd = await derivePassword({
      masterKey,
      domain,
      length: 24,
      includeSymbols: false,
      iterations: 10_000,
    });
    expect(/^[A-Za-z0-9]+$/.test(pwd)).toBe(true);
  });

  it('limits to allowed charset when includeSymbols=true', async () => {
    const allowed = /^[A-Za-z0-9!@#$%^&*_\-+=:,.?]+$/;
    const pwd = await derivePassword({
      masterKey,
      domain,
      length: 24,
      includeSymbols: true,
      iterations: 10_000,
    });
    expect(allowed.test(pwd)).toBe(true);
  });
});

describe('generateTOTP', () => {
  it('generates valid TOTP codes', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const result = await generateTOTP({ secret });

    expect(result.code).toMatch(/^\d{6}$/);
    expect(result.timeRemaining).toBeGreaterThan(0);
    expect(result.timeRemaining).toBeLessThanOrEqual(30);
  });

  it('generates consistent codes for the same timestamp', async () => {
    const secret = 'JBSWY3DPEHPK3PXP';
    const timestamp = 1234567890;

    const result1 = await generateTOTP({ secret, timestamp });
    const result2 = await generateTOTP({ secret, timestamp });

    expect(result1.code).toBe(result2.code);
    expect(result1.timeRemaining).toBe(result2.timeRemaining);
  });

  it('throws on empty secret', async () => {
    await expect(generateTOTP({ secret: '' })).rejects.toThrow(
      'Missing TOTP secret',
    );
  });

  it('throws on invalid secret', async () => {
    await expect(generateTOTP({ secret: 'XX' })).rejects.toThrow(
      'Invalid TOTP secret length',
    );
  });
});

describe('encryptSecretsFile and decryptSecretsFile', () => {
  const testSecrets: SecretEntry[] = [
    {
      name: 'Google:user@gmail.com',
      secret: 'JBSWY3DPEHPK3PXP',
      color: '#4285f4',
    },
    { name: 'Facebook:user', secret: 'ABCDEFGHIJKLMNOP' },
  ];

  const testSecretsFile = {
    v: 2,
    ts: Date.now(),
    d: testSecrets,
  };

  const masterPassword = 'test-password-123';

  it('encrypts and decrypts secrets file successfully', async () => {
    const encrypted = await encryptSecretsFile(testSecretsFile, masterPassword);
    expect(typeof encrypted).toBe('string');
    expect(encrypted.length).toBeGreaterThan(0);

    const decrypted = await decryptSecretsFile(encrypted, masterPassword);
    expect(decrypted.v).toBe(testSecretsFile.v);
    expect(decrypted.ts).toBe(testSecretsFile.ts);
    expect(decrypted.d).toHaveLength(testSecrets.length);
    expect(decrypted.d[0].name).toBe(testSecrets[0].name);
    expect(decrypted.d[0].secret).toBe(testSecrets[0].secret);
    expect(decrypted.d[0].color).toBe(testSecrets[0].color);
  });

  it('fails decryption with wrong password', async () => {
    const encrypted = await encryptSecretsFile(testSecretsFile, masterPassword);

    await expect(
      decryptSecretsFile(encrypted, 'wrong-password'),
    ).rejects.toThrow('Invalid file format or incorrect password');
  });

  it('throws on empty master password for encryption', async () => {
    await expect(encryptSecretsFile(testSecretsFile, '')).rejects.toThrow(
      'Master password is required',
    );
  });

  it('throws on empty master password for decryption', async () => {
    await expect(decryptSecretsFile('some-data', '')).rejects.toThrow(
      'Master password is required',
    );
  });

  it('throws on empty encrypted data', async () => {
    await expect(decryptSecretsFile('', masterPassword)).rejects.toThrow(
      'Encrypted data is required',
    );
  });

  it('produces different encrypted output each time', async () => {
    const encrypted1 = await encryptSecretsFile(
      testSecretsFile,
      masterPassword,
    );
    const encrypted2 = await encryptSecretsFile(
      testSecretsFile,
      masterPassword,
    );

    // Should be different due to random salt and IV
    expect(encrypted1).not.toBe(encrypted2);

    // But both should decrypt to the same content
    const decrypted1 = await decryptSecretsFile(encrypted1, masterPassword);
    const decrypted2 = await decryptSecretsFile(encrypted2, masterPassword);

    expect(decrypted1.d).toEqual(decrypted2.d);
  });
});
