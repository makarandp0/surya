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
    if (host.startsWith('www.')) host = host.slice(4);
    return host.toLowerCase();
  } catch {
    // Fallback if already a host
    let host = (urlString || '').trim();
    if (host.startsWith('www.')) host = host.slice(4);
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
    if (i >= bytes.length) i = 0;
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
  if (!masterKey) throw new Error('Missing master key');
  if (!domain) throw new Error('Missing domain');

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
