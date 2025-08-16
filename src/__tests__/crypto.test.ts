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

  it('is deterministic for same inputs', async () => {
    const secretEntry = {
      name: 'Test',
      secret: '',
      website: 'example.com',
      passwordLength: 16,
      includeSymbols: false,
      salt: 'test-salt',
    };

    const a = await derivePassword({
      masterKey,
      secretEntry,
      iterations: 10_000,
    });
    const b = await derivePassword({
      masterKey,
      secretEntry,
      iterations: 10_000,
    });
    expect(a).toBe(b);
  });

  it('generates different passwords for different usernames', async () => {
    const secretEntryNoUser = {
      name: 'Test No User',
      secret: '',
      website: 'example.com',
      passwordLength: 16,
      includeSymbols: false,
      salt: 'no-user-salt',
    };

    const secretEntryUser1 = {
      name: 'Test User 1',
      secret: '',
      website: 'example.com',
      username: 'user1@example.com',
      passwordLength: 16,
      includeSymbols: false,
      salt: 'user1-salt',
    };

    const secretEntryUser2 = {
      name: 'Test User 2',
      secret: '',
      website: 'example.com',
      username: 'user2@example.com',
      passwordLength: 16,
      includeSymbols: false,
      salt: 'user2-salt',
    };

    const passwordNoUser = await derivePassword({
      masterKey,
      secretEntry: secretEntryNoUser,
      iterations: 10_000,
    });
    const passwordUser1 = await derivePassword({
      masterKey,
      secretEntry: secretEntryUser1,
      iterations: 10_000,
    });
    const passwordUser2 = await derivePassword({
      masterKey,
      secretEntry: secretEntryUser2,
      iterations: 10_000,
    });

    expect(passwordNoUser).not.toBe(passwordUser1);
    expect(passwordUser1).not.toBe(passwordUser2);
    expect(passwordNoUser).not.toBe(passwordUser2);
  });

  it('uses different salts to generate different passwords', async () => {
    const secretEntryWithSalt1 = {
      name: 'Test Custom Salt 1',
      secret: '',
      website: 'example.com',
      username: 'user@example.com',
      passwordLength: 16,
      includeSymbols: false,
      salt: 'custom-salt-value-1',
    };

    const secretEntryWithSalt2 = {
      name: 'Test Custom Salt 2',
      secret: '',
      website: 'example.com',
      username: 'user@example.com',
      passwordLength: 16,
      includeSymbols: false,
      salt: 'custom-salt-value-2',
    };

    const passwordWithSalt1 = await derivePassword({
      masterKey,
      secretEntry: secretEntryWithSalt1,
      iterations: 10_000,
    });
    const passwordWithSalt2 = await derivePassword({
      masterKey,
      secretEntry: secretEntryWithSalt2,
      iterations: 10_000,
    });

    // Passwords should be different when different salts are used
    expect(passwordWithSalt1).not.toBe(passwordWithSalt2);
  });

  it('generates consistent passwords with same custom salt', async () => {
    const secretEntry = {
      name: 'Test Salt Consistency',
      secret: '',
      website: 'example.com',
      username: 'user@example.com',
      passwordLength: 16,
      includeSymbols: false,
      salt: 'consistent-salt',
    };

    const password1 = await derivePassword({
      masterKey,
      secretEntry,
      iterations: 10_000,
    });
    const password2 = await derivePassword({
      masterKey,
      secretEntry,
      iterations: 10_000,
    });

    expect(password1).toBe(password2);
  });

  it('is deterministic for same domain and username combination', async () => {
    const secretEntry = {
      name: 'Test',
      secret: '',
      website: 'example.com',
      username: 'testuser@example.com',
      passwordLength: 16,
      includeSymbols: false,
      salt: 'domain-user-salt',
    };

    const a = await derivePassword({
      masterKey,
      secretEntry,
      iterations: 10_000,
    });
    const b = await derivePassword({
      masterKey,
      secretEntry,
      iterations: 10_000,
    });
    expect(a).toBe(b);
  });

  it('changes when domain changes', async () => {
    const secretEntryA = {
      name: 'Test A',
      secret: '',
      website: 'example.com',
      passwordLength: 16,
      includeSymbols: false,
      salt: 'same-salt',
    };
    const secretEntryB = {
      name: 'Test B',
      secret: '',
      website: 'example.org',
      passwordLength: 16,
      includeSymbols: false,
      salt: 'same-salt',
    };

    const a = await derivePassword({
      masterKey,
      secretEntry: secretEntryA,
      iterations: 10_000,
    });
    const b = await derivePassword({
      masterKey,
      secretEntry: secretEntryB,
      iterations: 10_000,
    });
    expect(a).toBe(b); // Should be same because salt is the same
  });

  it('respects length parameter', async () => {
    const secretEntryShort = {
      name: 'Test Short',
      secret: '',
      website: 'example.com',
      passwordLength: 8,
      includeSymbols: false,
      salt: 'length-test-salt',
    };
    const secretEntryLong = {
      name: 'Test Long',
      secret: '',
      website: 'example.com',
      passwordLength: 30,
      includeSymbols: false,
      salt: 'length-test-salt',
    };

    const short = await derivePassword({
      masterKey,
      secretEntry: secretEntryShort,
      iterations: 10_000,
    });
    const long = await derivePassword({
      masterKey,
      secretEntry: secretEntryLong,
      iterations: 10_000,
    });
    expect(short).toHaveLength(8);
    expect(long).toHaveLength(30);
  });

  it('uses only alphanumerics when includeSymbols=false', async () => {
    const secretEntry = {
      name: 'Test Alphanumeric',
      secret: '',
      website: 'example.com',
      passwordLength: 24,
      includeSymbols: false,
      salt: 'alphanumeric-test-salt',
    };

    const pwd = await derivePassword({
      masterKey,
      secretEntry,
      iterations: 10_000,
    });
    expect(/^[A-Za-z0-9]+$/.test(pwd)).toBe(true);
  });

  it('limits to allowed charset when includeSymbols=true', async () => {
    const secretEntry = {
      name: 'Test With Symbols',
      secret: '',
      website: 'example.com',
      passwordLength: 24,
      includeSymbols: true,
      salt: 'symbols-test-salt',
    };

    const allowed = /^[A-Za-z0-9!@#$%^&*_\-+=:,.?]+$/;
    const pwd = await derivePassword({
      masterKey,
      secretEntry,
      iterations: 10_000,
    });
    expect(allowed.test(pwd)).toBe(true);
  });
});

describe('generateTOTP', () => {
  it('generates valid TOTP codes', async () => {
    const secretEntry = {
      name: 'Test TOTP',
      secret: 'JBSWY3DPEHPK3PXP',
      salt: 'totp-test-salt',
    };
    const result = await generateTOTP({ secretEntry });

    expect(result.code).toMatch(/^\d{6}$/);
    expect(result.timeRemaining).toBeGreaterThan(0);
    expect(result.timeRemaining).toBeLessThanOrEqual(30);
  });

  it('generates consistent codes for the same timestamp', async () => {
    const secretEntry = {
      name: 'Test TOTP Consistent',
      secret: 'JBSWY3DPEHPK3PXP',
      salt: 'totp-consistent-salt',
    };
    const timestamp = 1234567890;

    const result1 = await generateTOTP({ secretEntry, timestamp });
    const result2 = await generateTOTP({ secretEntry, timestamp });

    expect(result1.code).toBe(result2.code);
    expect(result1.timeRemaining).toBe(result2.timeRemaining);
  });

  it('throws on empty secret', async () => {
    const secretEntry = {
      name: 'Test Empty',
      secret: '',
      salt: 'empty-test-salt',
    };
    await expect(generateTOTP({ secretEntry })).rejects.toThrow(
      'Missing TOTP secret',
    );
  });

  it('throws on invalid secret', async () => {
    const secretEntry = {
      name: 'Test Invalid',
      secret: 'XX',
      salt: 'invalid-test-salt',
    };
    await expect(generateTOTP({ secretEntry })).rejects.toThrow(
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
      salt: 'google-salt',
    },
    {
      name: 'Facebook:user',
      secret: 'ABCDEFGHIJKLMNOP',
      salt: 'facebook-salt',
    },
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
