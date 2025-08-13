import React from 'react';
import { Box, VStack, Alert, AlertIcon } from '@chakra-ui/react';
import { UnifiedSectionProps } from '../types/credential';
import { useVaultSearch } from '../hooks/useVaultSearch';
import { useTotpTimer } from '../hooks/useTotpTimer';
import { CredentialCardComponent } from './CredentialCard';
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
    credentialCards,
    isGenerating,
    filteredCount,
    totalCount,
    updateTotpCodes,
  } = useVaultSearch(masterPassword, secrets);

  const { totpTimeRemaining } = useTotpTimer(
    credentialCards.length > 0,
    () => updateTotpCodes(), // Update TOTP codes
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
      {credentialCards.length > 0 && (
        <VStack spacing={2} w="full">
          {/* Global TOTP Timer - show only if any card has TOTP */}
          {credentialCards.some((card) => card.totpCode) && (
            <TotpTimer timeRemaining={totpTimeRemaining} />
          )}

          {credentialCards.map((card, index) => (
            <CredentialCardComponent
              key={`${card.secretEntry.name}-${index}`}
              card={card}
              originalIndex={card.originalIndex}
              onEdit={onEditSecret}
            />
          ))}
        </VStack>
      )}

      {/* No matches found */}
      {query.trim() && credentialCards.length === 0 && !isGenerating && (
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
