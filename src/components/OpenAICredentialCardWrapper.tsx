import React, { useCallback, useState, useEffect } from 'react';
import {
  SecretEntry,
  derivePassword,
  generateTOTP,
  normalizeDomainFromUrl,
} from '../crypto';
import { OpenAICredentialCard, type OpenAICredCardProps } from './OpenAiCard';

interface OpenAICredentialCardWrapperProps {
  secretEntry: SecretEntry;
  originalIndex: number;
  masterPassword: string;
  onEdit: (index: number) => void;
  onOpenSite?: (urlOrDomain: string) => void;
}

export const OpenAICredentialCardWrapper: React.FC<
  OpenAICredentialCardWrapperProps
> = ({ secretEntry, originalIndex, masterPassword, onEdit, onOpenSite }) => {
  const [totpCode, setTotpCode] = useState<string | undefined>();
  const [remainingSeconds, setRemaining] = useState<number | undefined>();

  const generatePassword = useCallback(async (): Promise<string> => {
    if (!masterPassword) {
      throw new Error('Master password is required');
    }

    // Determine the domain to use for password generation
    let targetDomain = '';
    if (secretEntry.website) {
      targetDomain = normalizeDomainFromUrl(secretEntry.website);
    }

    // Generate password deterministically
    const password = await derivePassword({
      masterKey: masterPassword,
      domain: targetDomain,
      username: secretEntry.username || '',
      length: secretEntry.passwordLength || 16,
      includeSymbols: secretEntry.includeSymbols || false,
    });

    return password;
  }, [masterPassword, secretEntry]);

  const updateTOTP = useCallback(async () => {
    if (!secretEntry.secret) {
      setTotpCode(undefined);
      return;
    }

    try {
      const totpResult = await generateTOTP({
        secret: secretEntry.secret,
      });
      setTotpCode(totpResult.code);

      // Calculate expiration time
      const now = Math.floor(Date.now() / 1000);
      const timeRemainingSeconds = 30 - (now % 30);
      setRemaining(timeRemainingSeconds);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to generate TOTP:', error);
      setTotpCode(undefined);
    }
  }, [secretEntry.secret]);

  // Generate TOTP on mount and set up refresh interval
  useEffect(() => {
    if (secretEntry.secret) {
      updateTOTP();

      // Set up interval to refresh TOTP
      const interval = setInterval(() => {
        updateTOTP();
      }, 1000); // Update every second to handle expiration

      return () => clearInterval(interval);
    }
  }, [secretEntry.secret, updateTOTP]);

  const openAIProps: OpenAICredCardProps = {
    id: originalIndex.toString(),
    website: secretEntry.website,
    username: secretEntry.username,
    name: secretEntry.name,
    lastUpdatedAt: new Date(),
    onRequestPassword: generatePassword,
    totpCode,
    totpExpiresAfterSeconds: remainingSeconds,
    totpPeriodSec: 30,
    onOpenSite:
      onOpenSite ||
      ((url) => {
        const finalUrl = url.startsWith('http') ? url : `https://${url}`;
        window.open(finalUrl, '_blank');
      }),
    onEdit: (id) => onEdit(parseInt(id, 10)),
  };

  return <OpenAICredentialCard {...openAIProps} />;
};
