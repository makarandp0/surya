import React, { useState, useEffect } from 'react';
import {
  Box,
  HStack,
  Text,
  useClipboard,
  IconButton,
  Card,
  CardBody,
  Skeleton,
} from '@chakra-ui/react';
import { FiUser, FiKey, FiClock, FiMoreVertical } from 'react-icons/fi';
import { SecretEntry } from '../crypto';
import { CredentialCard } from '../types/credential';
import { useCredentialGenerator } from '../hooks/useCredentialGenerator';

interface CredentialEntryProps {
  secretEntry: SecretEntry;
  originalIndex: number;
  masterPassword: string;
  onEdit: (index: number) => void;
}

export const CredentialEntryComponent: React.FC<CredentialEntryProps> = ({
  secretEntry,
  originalIndex,
  masterPassword,
  onEdit,
}) => {
  const [card, setCard] = useState<CredentialCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { generateCredentialCard } = useCredentialGenerator(masterPassword);

  // Generate credential card on mount
  useEffect(() => {
    const generateCard = async () => {
      if (!masterPassword) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const generatedCard = await generateCredentialCard(
          secretEntry,
          originalIndex,
        );
        setCard(generatedCard);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to generate credential card:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateCard();
  }, [secretEntry, originalIndex, masterPassword, generateCredentialCard]);

  const passwordClipboard = useClipboard(card?.password || '');
  const totpClipboard = useClipboard(card?.totpCode || '');
  const usernameClipboard = useClipboard(card?.username || '');

  const title =
    secretEntry.name || card?.domain || card?.username || 'Credential';
  const subtitle = (() => {
    if (card?.username && card?.domain) {
      return `${card.username}@${card.domain}`;
    }
    return card?.username || card?.domain || '';
  })();

  const handleCardClick = () => {
    onEdit(originalIndex);
  };

  if (isLoading) {
    return (
      <Card w="full" variant="elevated" borderRadius="lg">
        <CardBody px={3} py={2}>
          <HStack spacing={3} align="center">
            <Box flex={1} minW={0}>
              <Skeleton height="20px" width="60%" />
              <Skeleton height="16px" width="40%" mt={1} />
            </Box>
            <HStack spacing={1}>
              <Skeleton height="32px" width="32px" borderRadius="md" />
              <Skeleton height="32px" width="32px" borderRadius="md" />
              <Skeleton height="32px" width="32px" borderRadius="md" />
              <Skeleton height="32px" width="32px" borderRadius="md" />
            </HStack>
          </HStack>
        </CardBody>
      </Card>
    );
  }

  if (!card) {
    return (
      <Card w="full" variant="elevated" borderRadius="lg">
        <CardBody px={3} py={2}>
          <Text color="red.500">Failed to generate credential</Text>
        </CardBody>
      </Card>
    );
  }

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
