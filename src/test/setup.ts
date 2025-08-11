// Ensure Web Crypto API is available in tests (Node >=20 has it under node:crypto)
import { webcrypto } from 'node:crypto';

if (
  !(globalThis as typeof globalThis & { crypto?: unknown }).crypto ||
  !(
    (globalThis as typeof globalThis & { crypto?: { subtle?: unknown } })
      .crypto as { subtle?: unknown }
  )?.subtle
) {
  // Set up the crypto global with the Node.js webcrypto implementation
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: false,
  });
}

// Also ensure it's available on the global object for older polyfill compatibility
if (typeof global !== 'undefined' && !global.crypto) {
  (global as typeof global & { crypto?: unknown }).crypto =
    webcrypto as unknown as Crypto;
}
