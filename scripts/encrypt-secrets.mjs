#!/usr/bin/env node

/**
 * Utility script to encrypt existing TOTP backup files
 * Usage: node encrypt-secrets.mjs <input-file> <output-file> <password>
 */

import { readFileSync, writeFileSync } from 'fs';
import { createHash, randomBytes, createCipheriv, pbkdf2Sync } from 'crypto';

function encryptSecretsFile(secretsFile, masterPassword) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);

  // Derive key using PBKDF2
  const key = pbkdf2Sync(masterPassword, salt, 100000, 32, 'sha256');

  // Create cipher
  const cipher = createCipheriv('aes-256-gcm', key, iv);

  // Encrypt
  const data = JSON.stringify(secretsFile);
  let encrypted = cipher.update(data, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  // Get authentication tag
  const authTag = cipher.getAuthTag();

  // Combine salt + iv + authTag + encrypted data
  const combined = Buffer.concat([salt, iv, authTag, encrypted]);

  // Return base64 encoded result
  return combined.toString('base64');
}

function main() {
  const args = process.argv.slice(2);

  if (args.length !== 3) {
    console.log(
      'Usage: node encrypt-secrets.mjs <input-file> <output-file> <password>',
    );
    console.log('');
    console.log('Example:');
    console.log(
      '  node encrypt-secrets.mjs backup.json encrypted-backup.txt mypassword123',
    );
    process.exit(1);
  }

  const [inputFile, outputFile, password] = args;

  try {
    // Read input file
    const inputData = readFileSync(inputFile, 'utf8');
    const secretsFile = JSON.parse(inputData);

    // Validate format
    if (!secretsFile.v || !secretsFile.d || !Array.isArray(secretsFile.d)) {
      throw new Error('Invalid TOTP backup file format');
    }

    console.log(`Reading ${secretsFile.d.length} secrets from ${inputFile}...`);

    // Encrypt
    const encrypted = encryptSecretsFile(secretsFile, password);

    // Write output
    writeFileSync(outputFile, encrypted);

    console.log(`✅ Encrypted secrets written to ${outputFile}`);
    console.log('');
    console.log(
      '⚠️  IMPORTANT: Keep your password safe! Without it, your secrets cannot be recovered.',
    );
    console.log(
      '💡 You can now use this encrypted file with your ChromePass extension.',
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
