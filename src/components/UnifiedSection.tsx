import React, { useState } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  HStack,
  Text,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { UnifiedSectionProps } from '../types/credential';
import { useVaultSearch } from '../hooks/useVaultSearch';
import { useTotpTimer } from '../hooks/useTotpTimer';
import { CredentialCardComponent } from './CredentialCard';
import { VaultSearch } from './VaultSearch';
import { TotpTimer } from './TotpTimer';

export const UnifiedSection: React.FC<UnifiedSectionProps> = ({
  masterPassword,
  secrets,
  onLogout,
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

  const [cardVariant, setCardVariant] = useState<
    'grid' | 'chips' | 'microLabels'
  >('grid');

  return (
    <VStack spacing={2} w="full">
      {/* Header with logout */}
      <HStack justify="space-between" w="full" mb={1}>
        <Text fontSize="md" fontWeight="bold" color="gray.800">
          🔓 Vault ({secrets.length})
        </Text>
        <HStack spacing={2}>
          <ButtonGroup size="xs" isAttached variant="outline">
            <Button
              onClick={() => setCardVariant('grid')}
              colorScheme={cardVariant === 'grid' ? 'blue' : undefined}
            >
              Grid
            </Button>
            <Button
              onClick={() => setCardVariant('chips')}
              colorScheme={cardVariant === 'chips' ? 'blue' : undefined}
            >
              Chips
            </Button>
            <Button
              onClick={() => setCardVariant('microLabels')}
              colorScheme={cardVariant === 'microLabels' ? 'blue' : undefined}
            >
              Micro
            </Button>
          </ButtonGroup>
          <Button size="xs" variant="outline" onClick={onLogout}>
            Logout
          </Button>
        </HStack>
      </HStack>

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
              variant={cardVariant}
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
