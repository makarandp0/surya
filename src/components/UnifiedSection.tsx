import React, { useCallback } from 'react';
import { Box, VStack, Alert, AlertIcon, useToast } from '@chakra-ui/react';
import { UnifiedSectionProps } from '../types/credential';
import { useVaultSearch } from '../hooks/useVaultSearch';
import { useTotpTimer } from '../hooks/useTotpTimer';
import { useCredentialGenerator } from '../hooks/useCredentialGenerator';
import { CredentialEntryComponent } from './CredentialEntry';
import { VaultSearch } from './VaultSearch';
import { TotpTimer } from './TotpTimer';

export const UnifiedSection: React.FC<UnifiedSectionProps> = ({
  masterPassword,
  secrets,
  onEditSecret,
}) => {
  const toast = useToast();
  const { generateCredentialCard } = useCredentialGenerator(masterPassword);

  const {
    query,
    setQuery,
    filteredSecrets,
    matchedIndices,
    isGenerating,
    filteredCount,
    totalCount,
  } = useVaultSearch(masterPassword, secrets);

  // Check if any entry has TOTP for the timer display
  const hasAnyTotp = filteredSecrets.some((secret) => secret.secret);

  const { totpTimeRemaining } = useTotpTimer(hasAnyTotp, () => {
    // TOTP codes will be updated individually by each CredentialEntry component
    // This is just for the global timer display
  });

  const handleCopyUsername = useCallback(
    async (index: number) => {
      try {
        const secretEntry = secrets[index];
        const card = await generateCredentialCard(secretEntry, index);
        if (card.username) {
          await navigator.clipboard.writeText(card.username);
          toast({
            status: 'success',
            title: 'Username copied!',
            duration: 2000,
            isClosable: true,
          });
        }
      } catch (_error) {
        toast({
          status: 'error',
          title: 'Failed to copy username',
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    },
    [secrets, generateCredentialCard, toast],
  );

  const handleCopyPassword = useCallback(
    async (index: number) => {
      try {
        const secretEntry = secrets[index];
        const card = await generateCredentialCard(secretEntry, index);
        await navigator.clipboard.writeText(card.password);
        toast({
          status: 'success',
          title: 'Password copied!',
          duration: 2000,
          isClosable: true,
        });
      } catch (_error) {
        console.log('failed to copy password:', _error);
        const msg = _error instanceof Error ? _error.message : 'Unknown error';
        toast({
          status: 'error',
          title: 'Failed to copy password:' + msg,
          duration: 3000,
          isClosable: true,
          position: 'top',
        });
      }
    },
    [secrets, generateCredentialCard, toast],
  );

  const handleCopyTotp = useCallback(
    async (index: number) => {
      try {
        const secretEntry = secrets[index];
        const card = await generateCredentialCard(secretEntry, index);
        if (card.totpCode) {
          await navigator.clipboard.writeText(card.totpCode);
          toast({
            status: 'success',
            title: 'TOTP code copied!',
            duration: 2000,
            isClosable: true,
          });
        }
      } catch (_error) {
        toast({
          status: 'error',
          title: 'Failed to copy TOTP code',
          duration: 3000,
          isClosable: true,
        });
      }
    },
    [secrets, generateCredentialCard, toast],
  );

  return (
    <VStack spacing={2} w="full" pt={3}>
      {/* Main Vault Search */}
      <VaultSearch
        query={query}
        onQueryChange={setQuery}
        isGenerating={isGenerating}
        filteredCount={filteredCount}
        totalCount={totalCount}
      />

      {/* Generated Credential Cards */}
      {filteredSecrets.length > 0 && (
        <VStack spacing={2} w="full">
          {/* Global TOTP Timer - show only if any entry has TOTP */}
          {hasAnyTotp && <TotpTimer timeRemaining={totpTimeRemaining} />}

          {filteredSecrets.map((secret, index) => (
            <CredentialEntryComponent
              key={`${secret.name}-${index}`}
              secretEntry={secret}
              originalIndex={matchedIndices[index]}
              onEdit={onEditSecret}
              onCopyUsername={handleCopyUsername}
              onCopyPassword={handleCopyPassword}
              onCopyTotp={handleCopyTotp}
            />
          ))}
        </VStack>
      )}

      {/* No matches found */}
      {query.trim() && filteredSecrets.length === 0 && !isGenerating && (
        <Box
          w="full"
          bg="white"
          borderRadius="md"
          borderWidth="1px"
          p={3}
          shadow="sm"
        >
          <Alert status="info" borderRadius="md" fontSize="xs" py={2}>
            <AlertIcon boxSize={3} />
            No secrets found for "{query.trim()}"
          </Alert>
        </Box>
      )}

      {/* Secrets browser removed */}
    </VStack>
  );
};
