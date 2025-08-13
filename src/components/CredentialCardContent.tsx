import React from 'react';
import { VStack, HStack, Text, Badge } from '@chakra-ui/react';
import { FiGlobe, FiUser } from 'react-icons/fi';
import { SecretEntry, normalizeDomainFromUrl } from '../crypto';

interface CredentialCardContentProps {
  secretEntry: SecretEntry;
}

export const CredentialCardContent: React.FC<CredentialCardContentProps> = ({
  secretEntry,
}) => {
  // Extract basic display information from SecretEntry
  const domain = secretEntry.website
    ? normalizeDomainFromUrl(secretEntry.website)
    : '';

  const title =
    secretEntry.name || domain || secretEntry.username || 'Credential';

  return (
    <VStack spacing={3} h="full" justify="center" align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="flex-start">
        <VStack align="flex-start" spacing={1} flex={1}>
          <Text fontSize="xl" fontWeight="bold" color="gray.800" noOfLines={1}>
            {title}
          </Text>
          {domain && (
            <HStack spacing={1} align="center">
              <FiGlobe size={14} />
              <Text fontSize="sm" color="gray.500" noOfLines={1}>
                {domain}
              </Text>
            </HStack>
          )}
        </VStack>
      </HStack>

      {/* Metadata */}
      <VStack spacing={2} align="stretch">
        {secretEntry.username && (
          <HStack spacing={2} align="center">
            <FiUser size={16} color="gray" />
            <Text fontSize="md" color="gray.600" noOfLines={1}>
              {secretEntry.username}
            </Text>
          </HStack>
        )}

        {/* Features badges */}
        <HStack spacing={2}>
          <Badge colorScheme="blue" variant="subtle" size="sm">
            Password
          </Badge>
          {secretEntry.secret && (
            <Badge colorScheme="green" variant="subtle" size="sm">
              TOTP
            </Badge>
          )}
        </HStack>
      </VStack>
    </VStack>
  );
};
