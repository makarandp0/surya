# Surya - Unified Login Experience

Surya has been redesigned to provide a unified login experience that combines password generation and TOTP codes in a single interface.

## What's New

### 🔄 Unified Experience

- **Single Login**: One master password + one encrypted secrets file
- **Auto-Detection**: Automatically provides both password and 2FA code for matching websites
- **Smart Matching**: Intelligently matches domains to your stored secrets

### 🔐 Enhanced Security

- **Encrypted Storage**: Your secrets file is now encrypted with AES-256-GCM
- **Local Processing**: All encryption/decryption happens locally in your browser
- **No Cloud Dependency**: Everything stays on your device

## How to Use

### 1. Prepare Your Secrets File

If you have an existing TOTP backup file, you can encrypt it using the provided script:

```bash
node scripts/encrypt-secrets.mjs backup.json encrypted-secrets.txt your-master-password
```

### 2. Login Process

1. **Enter Master Password**: This will be used to decrypt your secrets
2. **Select Secrets File**: Choose your encrypted secrets file
3. **Click "Unlock Vault"**: Your secrets will be decrypted and loaded

### 3. Generate Credentials

1. **Enter Website Domain**: Type or paste the website domain (e.g., `google.com`)
2. **Configure Password**: Adjust length and symbols as needed
3. **Click Generate**: Both password and 2FA code will be generated if available

## File Format

The secrets file maintains compatibility with existing TOTP backup formats:

```json
{
  "v": 2,
  "ts": 1640995200000,
  "d": [
    {
      "name": "Google:user@gmail.com",
      "secret": "JBSWY3DPEHPK3PXP",
      "color": "#4285f4"
    },
    {
      "name": "GitHub:username",
      "secret": "ABCDEFGHIJKLMNOP",
      "color": "#333"
    }
  ]
}
```

## Security Features

### Password Generation

- **Deterministic**: Same inputs always produce the same password
- **PBKDF2-SHA256**: Industry-standard key derivation with 200,000 iterations
- **Configurable**: Adjust length (8-32 chars) and symbol inclusion

### TOTP Generation

- **RFC 6238 Compliant**: Standard 30-second time-based codes
- **HMAC-SHA1**: Standard algorithm for maximum compatibility
- **Auto-Refresh**: Codes automatically update every 30 seconds

### File Encryption

- **AES-256-GCM**: Authenticated encryption with integrity protection
- **PBKDF2**: 100,000 iterations for key derivation
- **Random Salt/IV**: Each encryption uses unique random values

## Domain Matching

Surya automatically matches domains to your stored secrets using intelligent fuzzy matching:

- **Exact Match**: `google.com` matches `Google:user@gmail.com`
- **Subdomain Match**: `mail.google.com` matches `Google:user@gmail.com`
- **Flexible Naming**: Handles various naming conventions in your secrets

## Migration from Old Version

1. **Export your TOTP secrets** from the old version
2. **Encrypt the backup file** using the provided script
3. **Use the new login interface** to access your unified vault

## Tips

- **Backup**: Keep multiple encrypted copies of your secrets file
- **Master Password**: Use a strong, memorable password you won't forget
- **Organization**: Use descriptive names in your secrets for better domain matching
- **Testing**: Verify your encrypted file works before deleting the original

## Troubleshooting

### Login Issues

- Ensure you're using the correct master password
- Verify the secrets file isn't corrupted
- Check that the file is properly encrypted

### Domain Matching

- Try different domain formats (with/without www, subdomains)
- Check the secret names in your file for typos
- Use the secrets browser to manually select entries

### 2FA Codes

- Ensure the secret key is valid Base32
- Check that your system clock is accurate
- Verify the secret hasn't expired or been revoked

## Privacy & Security

- **No Network Requests**: All operations happen locally
- **No Data Collection**: We don't collect or transmit any user data
- **Open Source**: All code is available for review
- **Browser Isolation**: Extension runs in isolated browser context
