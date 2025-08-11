// Ensure Web Crypto API is available in tests (Node >=20 has it under node:crypto)
import { webcrypto } from 'node:crypto';

if (
  !(globalThis as typeof globalThis & { crypto?: unknown }).crypto ||
  !(
    (globalThis as typeof globalThis & { crypto?: { subtle?: unknown } })
      .crypto as { subtle?: unknown }
  )?.subtle
) {
  (globalThis as typeof globalThis & { crypto?: unknown }).crypto =
    webcrypto as unknown as Crypto;
}
