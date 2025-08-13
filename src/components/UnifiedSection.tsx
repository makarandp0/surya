import React from 'react';
import { Box, VStack, Alert, AlertIcon } from '@chakra-ui/react';
import { UnifiedSectionProps } from '../types/credential';
import { useVaultSearch } from '../hooks/useVaultSearch';
import { useTotpTimer } from '../hooks/useTotpTimer';
import { CredentialEntryComponent } from './CredentialEntry';
import { VaultSearch } from './VaultSearch';
import { TotpTimer } from './TotpTimer';

export const UnifiedSection: React.FC<UnifiedSectionProps> = ({
  masterPassword,
  secrets,
  onEditSecret,
}) => {
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
              masterPassword={masterPassword}
              onEdit={onEditSecret}
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
