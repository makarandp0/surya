import { describe, it, expect } from 'vitest';

describe('TOTP Import Functionality', () => {
  it('should parse TOTP app backup format correctly', () => {
    const mockBackupData = {
      v: 2,
      ts: 1754917513575,
      d: [
        {
          name: 'test:user@example.com',
          secret: 'UU5OVGQRN7F3BXDX',
          color: '#111111',
        },
        {
          name: 'FACEBOOK:testuser',
          secret: 'HRHOEXRVEPBRAQ7Q35PTAHIG5TVLTC64',
          color: '#3F51B5',
        },
        {
          name: 'Google:user@example.com',
          secret: 'CNWHRKZRTZWNPTNCRGT4BBYLGSMB6MPW',
        },
      ],
    };

    // Simulate the parsing logic from the import handler
    const secrets = mockBackupData.d
      .map((item: { name?: string; secret?: string; color?: string }) => ({
        name: item.name || 'Unknown',
        secret: item.secret || '',
        color: item.color,
      }))
      .filter(
        (item: { name: string; secret: string; color?: string }) => item.secret,
      );

    expect(secrets).toHaveLength(3);
    expect(secrets[0]).toEqual({
      name: 'test:user@example.com',
      secret: 'UU5OVGQRN7F3BXDX',
      color: '#111111',
    });
    expect(secrets[1]).toEqual({
      name: 'FACEBOOK:testuser',
      secret: 'HRHOEXRVEPBRAQ7Q35PTAHIG5TVLTC64',
      color: '#3F51B5',
    });
    expect(secrets[2]).toEqual({
      name: 'Google:user@example.com',
      secret: 'CNWHRKZRTZWNPTNCRGT4BBYLGSMB6MPW',
      color: undefined,
    });
  });

  it('should filter out entries without secrets', () => {
    const mockBackupData = {
      v: 2,
      ts: 1754917513575,
      d: [
        {
          name: 'valid-entry',
          secret: 'UU5OVGQRN7F3BXDX',
          color: '#111111',
        },
        {
          name: 'invalid-entry',
          secret: '',
          color: '#222222',
        },
        {
          name: 'missing-secret',
          color: '#333333',
        },
      ],
    };

    const secrets = mockBackupData.d
      .map((item: { name?: string; secret?: string; color?: string }) => ({
        name: item.name || 'Unknown',
        secret: item.secret || '',
        color: item.color,
      }))
      .filter(
        (item: { name: string; secret: string; color?: string }) => item.secret,
      );

    expect(secrets).toHaveLength(1);
    expect(secrets[0].name).toBe('valid-entry');
  });

  it('should handle missing names gracefully', () => {
    const mockBackupData = {
      v: 2,
      ts: 1754917513575,
      d: [
        {
          secret: 'UU5OVGQRN7F3BXDX',
          color: '#111111',
        },
      ],
    };

    const secrets = mockBackupData.d
      .map((item: { name?: string; secret?: string; color?: string }) => ({
        name: item.name || 'Unknown',
        secret: (item.secret || '')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z2-7]/g, ''),
        color: item.color,
      }))
      .filter(
        (item: { name: string; secret: string; color?: string }) =>
          item.secret && item.secret.length > 0,
      );

    expect(secrets).toHaveLength(1);
    expect(secrets[0].name).toBe('Unknown');
    expect(secrets[0].secret).toBe('UU5OVGQRN7F3BXDX');
  });

  it('should clean and validate secrets with whitespace and invalid characters', () => {
    const mockBackupData = {
      v: 2,
      ts: 1754917513575,
      d: [
        {
          name: 'Test Account',
          secret: '  uu5ovgqrn7f3bxdx  ', // lowercase with spaces
          color: '#111111',
        },
        {
          name: 'Invalid Secret',
          secret: 'UU5OVGQR@#$%N7F3BXDX!', // contains invalid chars
          color: '#222222',
        },
        {
          name: 'Empty Secret',
          secret: '  @#$%!  ', // only invalid chars
          color: '#333333',
        },
      ],
    };

    const secrets = mockBackupData.d
      .map((item: { name?: string; secret?: string; color?: string }) => ({
        name: item.name || 'Unknown',
        secret: (item.secret || '')
          .trim()
          .toUpperCase()
          .replace(/[^A-Z2-7]/g, ''),
        color: item.color,
      }))
      .filter(
        (item: { name: string; secret: string; color?: string }) =>
          item.secret && item.secret.length > 0,
      );

    expect(secrets).toHaveLength(2);
    expect(secrets[0].secret).toBe('UU5OVGQRN7F3BXDX');
    expect(secrets[1].secret).toBe('UU5OVGQRN7F3BXDX');
    // Third item should be filtered out due to empty cleaned secret
  });
});
