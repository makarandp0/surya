import { useState, useCallback } from 'react';
import { useToast } from '@chakra-ui/react';
import {
  derivePassword,
  generateTOTP,
  normalizeDomainFromUrl,
  SecretEntry,
} from '../crypto';
import { CredentialCard } from '../types/credential';

export const useCredentialGeneration = (
  masterPassword: string,
  secrets: SecretEntry[],
) => {
  const toast = useToast();
  const [credentialCards, setCredentialCards] = useState<CredentialCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Find matching secrets for a domain
  const findSecretsForDomain = useCallback(
    (targetDomain: string): SecretEntry[] => {
      const normalizedTarget =
        normalizeDomainFromUrl(targetDomain).toLowerCase();

      return secrets.filter((secret) => {
        // Check if secret has explicit website field that matches
        if (secret.website) {
          const normalizedWebsite = normalizeDomainFromUrl(
            secret.website,
          ).toLowerCase();
          return normalizedWebsite === normalizedTarget;
        }

        // Fallback to name-based matching
        const secretName = secret.name.toLowerCase();
        return (
          secretName.includes(normalizedTarget) ||
          normalizedTarget.includes(secretName.split(':')[0]) ||
          secretName.includes(normalizedTarget.replace(/\./g, ''))
        );
      });
    },
    [secrets],
  );

  const generateCredentialsForDomain = useCallback(
    async (targetDomain: string, showLoading = true) => {
      if (!targetDomain || !masterPassword) {
        setCredentialCards([]);
        return;
      }

      if (showLoading) {
        setIsGenerating(true);
      }
      try {
        const normalizedDomain = normalizeDomainFromUrl(targetDomain);
        const matchingSecrets = findSecretsForDomain(normalizedDomain);

        const cards: CredentialCard[] = [];

        for (const secretEntry of matchingSecrets) {
          const username = secretEntry.username || '';
          const passwordLength = secretEntry.passwordLength ?? 16;
          const includeSymbols = secretEntry.includeSymbols ?? false;

          // Generate password using both domain and username
          const password = await derivePassword({
            masterKey: masterPassword,
            domain: normalizedDomain,
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
              });
            }
          }

          cards.push({
            secretEntry,
            domain: normalizedDomain,
            username,
            password,
            totpCode,
            totpTimeRemaining,
          });
        }

        setCredentialCards(cards);
      } catch (error) {
        toast({
          status: 'error',
          title: 'Generation Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        if (showLoading) {
          setIsGenerating(false);
        }
      }
    },
    [masterPassword, findSecretsForDomain, toast],
  );

  const updateTotpCodes = useCallback(async () => {
    if (credentialCards.length === 0) {
      return;
    }

    const updatedCards = await Promise.all(
      credentialCards.map(async (card) => {
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
      }),
    );

    setCredentialCards(updatedCards);
  }, [credentialCards]);

  return {
    credentialCards,
    isGenerating,
    generateCredentialsForDomain,
    updateTotpCodes,
  };
};
