// Ensure Web Crypto API is available in tests (Node >=18 has it under node:crypto)
import { webcrypto } from 'node:crypto'

if (!(globalThis as any).crypto || !(globalThis as any).crypto.subtle) {
  ;(globalThis as any).crypto = webcrypto as any
}

