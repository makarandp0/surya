import React from 'react';
import {
  Box,
  HStack,
  Text,
  IconButton,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FiUser, FiKey, FiClock, FiMoreVertical } from 'react-icons/fi';
import { SecretEntry, normalizeDomainFromUrl } from '../crypto';

interface CredentialEntryProps {
  secretEntry: SecretEntry;
  originalIndex: number;
  onEdit: (index: number) => void;
  onCopyUsername?: (index: number) => void;
  onCopyPassword?: (index: number) => void;
  onCopyTotp?: (index: number) => void;
}

export const CredentialCard: React.FC<CredentialEntryProps> = ({
  secretEntry,
  originalIndex,
  onEdit,
  onCopyUsername,
  onCopyPassword,
  onCopyTotp,
}) => {
  // Extract basic display information from SecretEntry
  const domain = secretEntry.website
    ? normalizeDomainFromUrl(secretEntry.website)
    : '';

  const title =
    secretEntry.name || domain || secretEntry.username || 'Credential';
  const subtitle = (() => {
    if (secretEntry.username && domain) {
      return `${secretEntry.username}@${domain}`;
    }
    return secretEntry.username || domain || '';
  })();

  const handleCardClick = () => {
    onEdit(originalIndex);
  };

  const handleCopyUsername = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyUsername?.(originalIndex);
  };

  const handleCopyPassword = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyPassword?.(originalIndex);
  };

  const handleCopyTotp = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCopyTotp?.(originalIndex);
  };

  return (
    <Card
      w="full"
      variant="elevated"
      borderRadius="lg"
      cursor="pointer"
      onClick={handleCardClick}
    >
      <CardBody px={3} py={2}>
        <HStack spacing={3} align="center">
          {/* Main info */}
          <Box flex={1} minW={0}>
            <Text
              fontSize="md"
              fontWeight="semibold"
              color="gray.800"
              noOfLines={1}
            >
              {title}
            </Text>
            {subtitle && (
              <Text fontSize="sm" color="gray.500" noOfLines={1}>
                {subtitle}
              </Text>
            )}
          </Box>

          {/* Action icons */}
          <HStack spacing={1}>
            {secretEntry.username && (
              <IconButton
                aria-label="Copy username"
                icon={<FiUser />}
                size="sm"
                variant="ghost"
                onClick={handleCopyUsername}
              />
            )}
            <IconButton
              aria-label="Copy password"
              icon={<FiKey />}
              size="sm"
              variant="ghost"
              onClick={handleCopyPassword}
            />
            {secretEntry.secret && (
              <IconButton
                aria-label="Copy TOTP"
                icon={<FiClock />}
                size="sm"
                variant="ghost"
                onClick={handleCopyTotp}
              />
            )}
            <IconButton
              aria-label="More"
              icon={<FiMoreVertical />}
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                // This will now navigate to edit page via card click
              }}
            />
          </HStack>
        </HStack>
      </CardBody>
    </Card>
  );
};
