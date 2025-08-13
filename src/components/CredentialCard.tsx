import React from 'react';
import {
  Box,
  HStack,
  Text,
  useClipboard,
  IconButton,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { FiUser, FiKey, FiClock, FiMoreVertical } from 'react-icons/fi';
import { CredentialCard } from '../types/credential';

interface CredentialCardProps {
  card: CredentialCard;
  originalIndex: number;
  onEdit: (index: number) => void;
}

export const CredentialCardComponent: React.FC<CredentialCardProps> = ({
  card,
  originalIndex,
  onEdit,
}) => {
  const passwordClipboard = useClipboard(card.password);
  const totpClipboard = useClipboard(card.totpCode || '');
  const usernameClipboard = useClipboard(card.username);

  const title =
    card.secretEntry.name || card.domain || card.username || 'Credential';
  const subtitle = (() => {
    if (card.username && card.domain) {
      return `${card.username}@${card.domain}`;
    }
    return card.username || card.domain || '';
  })();

  const handleCardClick = () => {
    onEdit(originalIndex);
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
            <IconButton
              aria-label="Copy username"
              icon={<FiUser />}
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                usernameClipboard.onCopy();
              }}
            />
            <IconButton
              aria-label="Copy password"
              icon={<FiKey />}
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                passwordClipboard.onCopy();
              }}
            />
            {card.totpCode && (
              <IconButton
                aria-label="Copy TOTP"
                icon={<FiClock />}
                size="sm"
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  totpClipboard.onCopy();
                }}
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
