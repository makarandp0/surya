# ChromePass — Unified Password & TOTP Manager

## Overview

ChromePass is a unified password manager and TOTP authenticator that provides:

- **Unified Login Experience**: Single master password + encrypted secrets file
- **Deterministic Password Generation**: Site-specific passwords derived from master key and domain
- **TOTP Authentication**: Time-based one-time passwords with automatic domain matching
- **Local Encryption**: AES-256-GCM encryption, all processing happens locally
- **No Cloud Storage**: Everything stays on your device
- **Built with Modern Stack**: Vite + React + Chakra UI, Chrome Manifest V3

## Features

### 🔐 Password Generation

- Deterministic passwords using PBKDF2-SHA256 (200,000 iterations)
- Configurable length (8-32 characters) and symbol inclusion
- Domain normalization for consistent results
- Same inputs always produce the same password

### 🔢 TOTP Authentication

- RFC 6238 compliant time-based codes
- Automatic domain matching to stored secrets
- 30-second refresh with visual countdown
- Compatible with existing TOTP backup formats

### 🛡️ Security

- AES-256-GCM file encryption with PBKDF2 key derivation
- Master password never stored or transmitted
- All cryptographic operations performed locally
- Open source and auditable

## Getting Started

**Note**: This project uses yarn only. npm commands are blocked to ensure consistency.

- Install deps: `yarn install`
- Dev (web preview): `yarn dev`
  - Note: chrome.\* APIs are unavailable in dev. Domain field is editable.
- Build extension: `yarn build`
- Load in Chrome: chrome://extensions → Enable Developer mode → Load unpacked → select the dist/ folder.

## Usage

### Initial Setup

1. **Prepare Your Secrets File** (optional):

   ```bash
   # Encrypt existing TOTP backup
   node scripts/encrypt-secrets.mjs backup.json encrypted-secrets.txt your-password
   ```

2. **Login Process**:
   - Enter your master password
   - Select your encrypted secrets file (or use unencrypted for backward compatibility)
   - Click "🚀 Unlock Vault"

### Generating Credentials

1. **Enter Domain**: Type the website domain (auto-detected from active tab)
2. **Configure Password**: Adjust length and symbols as needed
3. **Click Generate**: Get both password and 2FA code (if available)

### Domain Matching

ChromePass intelligently matches domains to your stored secrets:

- `google.com` matches `Google:user@gmail.com`
- `github.com` matches `GitHub:username`
- Handles subdomains and various naming conventions

## File Format

Compatible with existing TOTP backup formats:

```json
{
  "v": 2,
  "ts": 1640995200000,
  "d": [
    {
      "name": "Google:user@gmail.com",
      "secret": "JBSWY3DPEHPK3PXP",
      "color": "#4285f4"
    }
  ]
}
```

## Testing & Type Checking

- Type check: `yarn typecheck`
- Run tests: `yarn test`
- Watch tests: `yarn test:watch`
- Coverage report: `yarn coverage` (outputs to coverage/)

## Versioning

- Source of truth: `package.json#version`.
- Manifest sync: `scripts/sync-version.mjs` writes the same version into `public/manifest.json` (runs automatically before `yarn build`).
- Deploy bump: the GitHub Pages deploy workflow auto-bumps the patch version on pushes to `master`, commits the change, and creates a tag `vX.Y.Z`.
- Releases: the release workflow syncs the manifest version to the tag (e.g., `v1.2.3`) before building the ZIP.
- A sample file is included at `public/sample-totp-backup.json` for testing.

Derivation Details

- **Passwords**: PBKDF2(SHA-256), iterations: 200,000, salt: "site:" + domain.
- **TOTP**: HMAC-SHA1 with 30-second time windows (RFC 6238 compliant).
- The derived bytes are mapped into an allowed character set (A–Z, a–z, 0–9, and optional symbols).
- The output is deterministic for the same (master key, domain, options).

Security Notes

- Master key and TOTP secrets are held only in memory while the popup is open.
- There is no server, database, or sync. Consider a secure backup of your master key and TOTP secrets.
- TOTP codes are generated entirely locally using Web Crypto API.

Structure

- public/manifest.json — Chrome MV3 manifest (copied to dist/)
- public/sample-totp-backup.json — Sample TOTP backup file for testing
- index.html — Popup HTML (Vite entry)
- src/crypto.ts — Derivation helpers (PBKDF2 + TOTP)
- src/App.tsx — Popup UI (React + Chakra)
- src/main.tsx — App bootstrap
