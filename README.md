ChromePass — MV3 Vite + React + Chakra

Overview

- Deterministic password manager: generates a site-specific password from a master key and the site domain.
- TOTP authenticator: generates time-based one-time passwords with import support for TOTP app backups.
- No storage, no network, entirely local in the popup.
- Built with Vite + React + Chakra UI. Chrome Manifest V3.

Getting Started

**Note**: This project uses yarn only. npm commands are blocked to ensure consistency.

- Install deps: yarn install
- Dev (web preview): yarn dev
  - Note: chrome.\* APIs are unavailable in dev. Domain field is editable.
- Build extension: yarn build
- Load in Chrome: chrome://extensions → Enable Developer mode → Load unpacked → select the dist/ folder.

Testing & Type Checking

- Type check: yarn typecheck
- Run tests: yarn test
- Watch tests: yarn test:watch
- Coverage report: yarn coverage (outputs to coverage/)

Versioning

- Source of truth: `package.json#version`.
- Manifest sync: `scripts/sync-version.mjs` writes the same version into `public/manifest.json` (runs automatically before `yarn build`).
- Deploy bump: the GitHub Pages deploy workflow auto-bumps the patch version on pushes to `master`, commits the change, and creates a tag `vX.Y.Z`.
- Releases: the release workflow syncs the manifest version to the tag (e.g., `v1.2.3`) before building the ZIP.

Usage

**Password Mode:**

- Click the extension icon to open the popup.
- Enter your Master Key. We do not store it.
- The Site Domain auto-fills from the active tab; you can edit it.
- Choose length and whether to include symbols, then Generate.
- Click Copy to put the password on your clipboard.

**TOTP Mode:**

- Switch to TOTP mode using the radio buttons.
- **Import Method**: Click "Import File" to import TOTP secrets from backup files (supports TOTP app JSON format).
- **Manual Method**: Enter a Base32 secret key directly.
- Select from imported accounts or use manual entry.
- Generate TOTP codes with automatic refresh and time remaining indicator.
- Click Copy to put the code on your clipboard.

TOTP Import Support

- Supports JSON backup files from TOTP apps in the format:
  ```json
  {
    "v": 2,
    "ts": timestamp,
    "d": [
      {
        "name": "Account Name",
        "secret": "BASE32SECRET",
        "color": "#HexColor"
      }
    ]
  }
  ```
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
