import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { useDebounce } from './useDebounce';
import { useMultiFieldSearch } from './useMultiFieldSearch';
import {
  derivePassword,
  generateTOTP,
  normalizeDomainFromUrl,
  SecretEntry,
} from '../crypto';
import { CredentialCard } from '../types/credential';

export const useVaultSearch = (
  masterPassword: string,
  secrets: SecretEntry[],
) => {
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [credentialCards, setCredentialCards] = useState<CredentialCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Debounce the query to avoid too frequent searches
  const debouncedQuery = useDebounce(query, 500);

  // Search across multiple fields
  const { filteredSecrets, matchedIndices, filteredCount } =
    useMultiFieldSearch(
      secrets,
      debouncedQuery,
      0, // Allow searching from first character
    );

  // Generate credentials for matched secrets
  const generateCredentialsForSecrets = useCallback(
    async (
      matchedSecrets: SecretEntry[],
      indices: number[],
      showLoading = true,
    ) => {
      if (!masterPassword) {
        setCredentialCards([]);
        return;
      }

      if (showLoading) {
        setIsGenerating(true);
      }

      try {
        const cards: CredentialCard[] = [];

        for (let i = 0; i < matchedSecrets.length; i++) {
          const secretEntry = matchedSecrets[i];
          const originalIndex = indices[i];

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

          cards.push({
            secretEntry,
            domain: targetDomain,
            username,
            password,
            totpCode,
            totpTimeRemaining,
            originalIndex,
          });
        }

        setCredentialCards(cards);
      } catch (error) {
        toast({
          status: 'error',
          title: 'Generation Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        if (showLoading) {
          setIsGenerating(false);
        }
      }
    },
    [masterPassword, toast],
  );

  // Update TOTP codes for existing cards
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

  // Generate credentials when search results change
  useEffect(() => {
    if (debouncedQuery.trim()) {
      generateCredentialsForSecrets(filteredSecrets, matchedIndices, true);
    } else {
      // Clear results when query is empty
      setCredentialCards([]);
    }
  }, [
    debouncedQuery,
    filteredSecrets,
    matchedIndices,
    generateCredentialsForSecrets,
  ]);

  return {
    query,
    setQuery,
    credentialCards,
    isGenerating:
      isGenerating || (query !== debouncedQuery && query.trim() !== ''),
    filteredCount,
    totalCount: secrets.length,
    updateTotpCodes,
  };
};
