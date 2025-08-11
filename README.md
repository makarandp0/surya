ChromePass — MV3 Vite + React + Chakra

Overview

- Deterministic password manager: generates a site-specific password from a master key and the site domain.
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

- Click the extension icon to open the popup.
- Enter your Master Key. We do not store it.
- The Site Domain auto-fills from the active tab; you can edit it.
- Choose length and whether to include symbols, then Generate.
- Click Copy to put the password on your clipboard.

Derivation Details

- Algorithm: PBKDF2(SHA-256), iterations: 200,000, salt: "site:" + domain.
- The derived bytes are mapped into an allowed character set (A–Z, a–z, 0–9, and optional symbols).
- The output is deterministic for the same (master key, domain, options).

Security Notes

- Master key is held only in memory while the popup is open.
- There is no server, database, or sync. Consider a secure backup of your master key.

Structure

- public/manifest.json — Chrome MV3 manifest (copied to dist/)
- index.html — Popup HTML (Vite entry)
- src/crypto.js — Derivation helpers (PBKDF2 + mapping)
- src/App.jsx — Popup UI (React + Chakra)
- src/main.jsx — App bootstrap
