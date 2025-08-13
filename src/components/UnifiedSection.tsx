import React from 'react';
import { Box, VStack, Alert, AlertIcon } from '@chakra-ui/react';
import { UnifiedSectionProps } from '../types/credential';
import { useVaultSearch } from '../hooks/useVaultSearch';
import { FlipCredentialCard } from './FlipCredentialCard';
import { VaultSearch } from './VaultSearch';

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
          {filteredSecrets.map((secret, index) => (
            <FlipCredentialCard
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
    </VStack>
  );
};
