import { useCallback, useState, useEffect, useRef } from 'react';
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
  const [card, setCard] = useState<CredentialCard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const updateTotpCode = useCallback(
    async (currentCard: CredentialCard): Promise<CredentialCard> => {
      if (!currentCard.secretEntry.secret) {
        return currentCard;
      }

      try {
        const totpResult = await generateTOTP({
          secret: currentCard.secretEntry.secret,
        });
        return {
          ...currentCard,
          totpCode: totpResult.code,
          totpTimeRemaining: totpResult.timeRemaining,
        };
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to update TOTP:', error);
        return currentCard;
      }
    },
    [],
  );

  const generateCredentialCard = useCallback(
    async (secretEntry: SecretEntry, originalIndex: number): Promise<void> => {
      if (!masterPassword) {
        setError('Master password is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Clear any existing interval
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }

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

        const newCard: CredentialCard = {
          secretEntry,
          domain: targetDomain,
          username,
          password,
          totpCode,
          totpTimeRemaining,
          originalIndex,
        };

        setCard(newCard);

        // Set up TOTP refresh interval if we have a TOTP secret
        if (secretEntry.secret && totpCode) {
          intervalRef.current = setInterval(async () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = 30 - (now % 30);

            // Update the time remaining every second
            setCard((prevCard) => {
              if (!prevCard) {
                return prevCard;
              }
              return {
                ...prevCard,
                totpTimeRemaining: remaining,
              };
            });

            // Regenerate TOTP code when it expires (at the start of a new 30-second period)
            if (remaining === 30) {
              setCard((prevCard) => {
                if (!prevCard) {
                  return prevCard;
                }
                // Async operation needs to be handled differently
                updateTotpCode(prevCard).then((updatedCard) => {
                  setCard(updatedCard);
                });
                return prevCard; // Return current card while async update is in progress
              });
            }
          }, 1000);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to generate credential';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [masterPassword, toast, updateTotpCode],
  );

  return {
    card,
    isLoading,
    error,
    generateCredentialCard,
    updateTotpCode,
  };
};
