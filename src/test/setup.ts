// Ensure Web Crypto API is available in tests (Node >=20 has it under node:crypto)
import { webcrypto } from 'node:crypto';

// More robust setup to ensure crypto is available in all environments
const ensureCrypto = () => {
  // Check if crypto.subtle is available
  const hasCrypto =
    typeof globalThis.crypto === 'object' &&
    globalThis.crypto !== null &&
    typeof globalThis.crypto.subtle === 'object' &&
    globalThis.crypto.subtle !== null;

  if (!hasCrypto) {
    // Set up the crypto global with the Node.js webcrypto implementation
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto,
      writable: false,
      configurable: false,
    });
  }
};

// Call the setup
ensureCrypto();

// Also ensure it's available on the global object for older polyfill compatibility
if (typeof global !== 'undefined' && !global.crypto) {
  (global as typeof global & { crypto?: unknown }).crypto =
    webcrypto as unknown as Crypto;
}
