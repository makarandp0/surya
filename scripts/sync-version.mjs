// Sync Chrome extension manifest version with package.json or provided arg
// Usage:
//   node scripts/sync-version.mjs              # uses package.json version
//   node scripts/sync-version.mjs 1.2.3        # explicit version
//   node scripts/sync-version.mjs v1.2.3       # leading v is allowed

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pkgPath = path.join(root, 'package.json');
const manifestPath = path.join(root, 'public', 'manifest.json');

function coerceChromeVersion(input) {
  let v = String(input || '').trim();
  if (!v) return '';
  if (v.startsWith('v')) v = v.slice(1);
  // Chrome allows up to 4 numeric dot-separated components (0-65535)
  const parts = v.split('.').map((p) => String(parseInt(p, 10))); // normalize numeric
  if (parts.some((p) => Number.isNaN(Number(p)))) return '';
  if (parts.length > 4) return parts.slice(0, 4).join('.');
  return parts.join('.');
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJSON(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

try {
  const arg = process.argv[2];
  const explicit = coerceChromeVersion(arg || process.env.VERSION || '');
  const pkg = readJSON(pkgPath);
  const pkgVersion = coerceChromeVersion(pkg.version);
  if (!pkgVersion && !explicit) {
    console.error('Unable to determine version: package.json has no semver-like version');
    process.exit(1);
  }

  const manifest = readJSON(manifestPath);
  const nextVersion = explicit || pkgVersion;
  if (!nextVersion) {
    console.error('No valid version computed');
    process.exit(1);
  }

  if (manifest.version !== nextVersion) {
    manifest.version = nextVersion;
    writeJSON(manifestPath, manifest);
    console.log(`Updated manifest.json version -> ${nextVersion}`);
  } else {
    console.log(`manifest.json already at version ${nextVersion}`);
  }
} catch (err) {
  console.error('Version sync failed:', err);
  process.exit(1);
}

