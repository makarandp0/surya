import { describe, it, expect } from 'vitest';
import { derivePassword, normalizeDomainFromUrl } from '../crypto';

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
