import { describe, expect, it } from 'vitest';
import { generateTOTP } from '../crypto';

describe('TOTP Generation', () => {
  it('generates valid TOTP codes for test vector', async () => {
    // RFC 6238 test vectors (well-known test secret: GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ)
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

    // Test with known timestamp to get predictable result
    const testTimestamp = 1111111109; // This should generate code 081804
    const result = await generateTOTP({
      secret,
      timestamp: testTimestamp,
    });

    expect(result.code).toBe('081804');
    expect(result.timeRemaining).toBeGreaterThan(0);
    expect(result.timeRemaining).toBeLessThanOrEqual(30);
  });

  it('generates 6-digit codes by default', async () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const result = await generateTOTP({ secret });

    expect(result.code).toMatch(/^\d{6}$/);
  });

  it('generates codes with custom digits', async () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const result = await generateTOTP({ secret, digits: 8 });

    expect(result.code).toMatch(/^\d{8}$/);
  });

  it('handles different time periods', async () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
    const timestamp = 1111111109;

    // 30-second period (default)
    const result30 = await generateTOTP({ secret, timestamp });

    // 60-second period
    const result60 = await generateTOTP({ secret, timestamp, period: 60 });

    // Different periods should generate different codes for the same timestamp
    expect(result30.code).not.toBe(result60.code);
  });

  it('throws error for invalid secret', async () => {
    await expect(generateTOTP({ secret: '' })).rejects.toThrow(
      'Missing TOTP secret',
    );
    await expect(generateTOTP({ secret: 'INVALID123!' })).rejects.toThrow();
  });

  it('generates different codes for consecutive time windows', async () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

    // Two timestamps 30 seconds apart should generate different codes
    const timestamp1 = 1111111100; // Start of a 30-second window
    const timestamp2 = 1111111130; // Start of next 30-second window

    const result1 = await generateTOTP({ secret, timestamp: timestamp1 });
    const result2 = await generateTOTP({ secret, timestamp: timestamp2 });

    expect(result1.code).not.toBe(result2.code);
  });

  it('calculates time remaining correctly', async () => {
    const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

    // Test at different positions within a 30-second window
    const windowStart = Math.floor(Date.now() / 30000) * 30000; // Start of current window

    const result1 = await generateTOTP({
      secret,
      timestamp: windowStart / 1000,
    });
    expect(result1.timeRemaining).toBe(30);

    const result2 = await generateTOTP({
      secret,
      timestamp: (windowStart + 10000) / 1000,
    });
    expect(result2.timeRemaining).toBe(20);

    const result3 = await generateTOTP({
      secret,
      timestamp: (windowStart + 29000) / 1000,
    });
    expect(result3.timeRemaining).toBe(1);
  });
});
