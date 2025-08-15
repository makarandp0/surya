import React from 'react';
import { Box, VStack, Alert, AlertIcon } from '@chakra-ui/react';
import { useVaultSearch } from '../hooks/useVaultSearch';
import { CredentialCardRenderer } from './CredentialCardRenderer';
import { VaultSearch } from './VaultSearch';
import { useAppContext, useAppActions } from '../contexts/useAppContext';

export const UnifiedSection: React.FC = () => {
  const { state } = useAppContext();
  const actions = useAppActions();

  const { masterPassword, secrets } = state;
  const {
    query,
    setQuery,
    filteredSecrets,
    matchedIndices,
    isGenerating,
    filteredCount,
    totalCount,
  } = useVaultSearch(secrets);

  return (
    <VStack spacing={2} w="full" pt={3}>
      {/* Main Vault Search */}
      <VStack spacing={2} w="full">
        <VaultSearch
          query={query}
          onQueryChange={setQuery}
          isGenerating={isGenerating}
          filteredCount={filteredCount}
          totalCount={totalCount}
        />
      </VStack>

      {/* Generated Credential Cards */}
      {filteredSecrets.length > 0 && (
        <VStack spacing={2} w="full">
          {filteredSecrets.map((secret, index) => (
            <CredentialCardRenderer
              key={`${secret.name}-${index}`}
              secretEntry={secret}
              originalIndex={matchedIndices[index]}
              masterPassword={masterPassword}
              onEdit={actions.startEdit}
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
    </VStack>
  );
};
