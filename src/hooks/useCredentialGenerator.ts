import { useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import {
  derivePassword,
  generateTOTP,
  normalizeDomainFromUrl,
  SecretEntry,
} from '../crypto';
import { CredentialCard } from '../types/credential';

export const useCredentialGenerator = (masterPassword: string) => {
  const toast = useToast();

  const generateCredentialCard = useCallback(
    async (
      secretEntry: SecretEntry,
      originalIndex: number,
    ): Promise<CredentialCard> => {
      // Determine the domain to use for password generation
      let targetDomain = '';
      if (secretEntry.website) {
        targetDomain = normalizeDomainFromUrl(secretEntry.website);
      } else {
        // Extract from name as fallback
        const nameParts = secretEntry.name.split(':');
        if (nameParts.length > 0) {
          targetDomain = normalizeDomainFromUrl(nameParts[0] + '.com');
        }
      }

      const username = secretEntry.username || '';
      const passwordLength = secretEntry.passwordLength ?? 16;
      const includeSymbols = secretEntry.includeSymbols ?? false;

      // Generate password using domain and username
      const password = await derivePassword({
        masterKey: masterPassword,
        domain: targetDomain,
        username,
        length: passwordLength,
        includeSymbols,
      });

      let totpCode: string | undefined;
      let totpTimeRemaining: number | undefined;

      if (secretEntry.secret) {
        try {
          const totpResult = await generateTOTP({
            secret: secretEntry.secret,
          });
          totpCode = totpResult.code;
          totpTimeRemaining = totpResult.timeRemaining;
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Failed to generate TOTP:', error);
          toast({
            status: 'warning',
            title: 'TOTP Generation Failed',
            description: `Could not generate 2FA code for ${secretEntry.name}`,
            duration: 3000,
            isClosable: true,
          });
        }
      }

      return {
        secretEntry,
        domain: targetDomain,
        username,
        password,
        totpCode,
        totpTimeRemaining,
        originalIndex,
      };
    },
    [masterPassword, toast],
  );

  const updateTotpCode = useCallback(
    async (card: CredentialCard): Promise<CredentialCard> => {
      if (!card.secretEntry.secret) {
        return card;
      }

      try {
        const totpResult = await generateTOTP({
          secret: card.secretEntry.secret,
        });
        return {
          ...card,
          totpCode: totpResult.code,
          totpTimeRemaining: totpResult.timeRemaining,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to update TOTP:', error);
        return card;
      }
    },
    [],
  );

  return {
    generateCredentialCard,
    updateTotpCode,
  };
};
