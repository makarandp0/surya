// Deterministic password derivation using Web Crypto PBKDF2

const te = new TextEncoder();

async function getKeyMaterial(masterKey: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    te.encode(masterKey),
    { name: 'PBKDF2' },
    false,
    ['deriveBits'],
  );
}

export function normalizeDomainFromUrl(urlString: string): string {
  try {
    const url = new URL(urlString);
    let host = url.hostname || '';
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    return host.toLowerCase();
  } catch {
    // Fallback if already a host
    let host = (urlString || '').trim();
    if (host.startsWith('www.')) {
      host = host.slice(4);
    }
    return host.toLowerCase();
  }
}

function mapBytesToCharset(
  bytes: Uint8Array,
  length: number,
  opts: { includeSymbols: boolean },
): string {
  const base = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const symbols = '!@#$%^&*_-+=:,.?';
  const charset = opts.includeSymbols ? base + symbols : base;
  const out = [];
  let i = 0;
  for (let j = 0; j < length; j++) {
    if (i >= bytes.length) {
      i = 0;
    }
    const idx = bytes[i] % charset.length;
    out.push(charset[idx]);
    i++;
  }
  return out.join('');
}

export async function derivePassword({
  masterKey,
  domain,
  length = 16,
  includeSymbols = false,
  iterations = 200000,
}: {
  masterKey: string;
  domain: string;
  length?: number;
  includeSymbols?: boolean;
  iterations?: number;
}): Promise<string> {
  if (!masterKey) {
    throw new Error('Missing master key');
  }
  if (!domain) {
    throw new Error('Missing domain');
  }

  const keyMaterial = await getKeyMaterial(masterKey);
  const salt = te.encode(`site:${domain}`);
  // Derive 64 bytes to have enough entropy for mapping
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt,
      iterations,
    },
    keyMaterial,
    64 * 8,
  );
  const bytes = new Uint8Array(bits);
  return mapBytesToCharset(bytes, length, { includeSymbols });
}

// Base32 decoding for TOTP secret keys
function base32Decode(encoded: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';

  // Remove padding and convert to uppercase
  encoded = encoded.replace(/=/g, '').toUpperCase();

  for (const char of encoded) {
    const index = alphabet.indexOf(char);
    if (index === -1) {
      throw new Error('Invalid base32 character');
    }
    bits += index.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let i = 0; i < bits.length; i += 8) {
    if (bits.length - i >= 8) {
      bytes.push(parseInt(bits.substr(i, 8), 2));
    }
  }

  // Create a new Uint8Array to ensure we have a clean, detached buffer
  return new Uint8Array(bytes);
}

// HMAC-SHA1 implementation for TOTP
async function hmacSha1(
  key: Uint8Array,
  data: Uint8Array,
): Promise<Uint8Array> {
  // Ensure we have proper ArrayBuffer instances for Web Crypto API
  // Create new ArrayBuffers and copy the data to avoid any shared buffer issues
  const keyBuffer = new ArrayBuffer(key.byteLength);
  const keyView = new Uint8Array(keyBuffer);
  keyView.set(key);

  const dataBuffer = new ArrayBuffer(data.byteLength);
  const dataView = new Uint8Array(dataBuffer);
  dataView.set(data);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer);
  return new Uint8Array(signature);
}

// Convert number to 8-byte big-endian array
function numberTo8ByteArray(num: number): Uint8Array {
  const array = new Uint8Array(8);
  for (let i = 7; i >= 0; i--) {
    array[i] = num & 0xff;
    num = Math.floor(num / 256);
  }
  return array;
}

export async function generateTOTP({
  secret,
  digits = 6,
  period = 30,
  timestamp,
}: {
  secret: string;
  digits?: number;
  period?: number;
  timestamp?: number;
}): Promise<{ code: string; timeRemaining: number }> {
  if (!secret) {
    throw new Error('Missing TOTP secret');
  }

  const now = timestamp || Math.floor(Date.now() / 1000);
  const counter = Math.floor(now / period);
  const timeRemaining = period - (now % period);

  try {
    // Decode base32 secret
    const secretBytes = base32Decode(secret);

    // Convert counter to 8-byte array
    const counterBytes = numberTo8ByteArray(counter);

    // Generate HMAC
    const hmac = await hmacSha1(secretBytes, counterBytes);

    // Dynamic truncation
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      (((hmac[offset] & 0x7f) << 24) |
        ((hmac[offset + 1] & 0xff) << 16) |
        ((hmac[offset + 2] & 0xff) << 8) |
        (hmac[offset + 3] & 0xff)) %
      Math.pow(10, digits);

    return {
      code: code.toString().padStart(digits, '0'),
      timeRemaining,
    };
  } catch (error) {
    throw new Error(
      `Failed to generate TOTP: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`,
    );
  }
}
