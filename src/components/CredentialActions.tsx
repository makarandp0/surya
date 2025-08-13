import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  useClipboard,
  Card,
  CardBody,
  Skeleton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiCopy, FiRefreshCw } from 'react-icons/fi';
import { SecretEntry } from '../crypto';
import { CredentialCard } from '../types/credential';
import { useCredentialGenerator } from '../hooks/useCredentialGenerator';
import { TotpTimer } from './TotpTimer';

interface CredentialActionsProps {
  secretEntry: SecretEntry;
  originalIndex: number;
  masterPassword: string;
}

export const CredentialActions: React.FC<CredentialActionsProps> = ({
  secretEntry,
  originalIndex,
  masterPassword,
}) => {
  const [card, setCard] = useState<CredentialCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { generateCredentialCard } = useCredentialGenerator(masterPassword);

  const passwordClipboard = useClipboard(card?.password || '');
  const totpClipboard = useClipboard(card?.totpCode || '');
  const usernameClipboard = useClipboard(card?.username || '');

  // Generate credential card on mount
  useEffect(() => {
    const generateCard = async () => {
      if (!masterPassword) {
        setError('Master password is required');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const generatedCard = await generateCredentialCard(
          secretEntry,
          originalIndex,
        );
        setCard(generatedCard);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to generate credential';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    generateCard();
  }, [secretEntry, originalIndex, masterPassword, generateCredentialCard]);

  const handleRefresh = async () => {
    if (!masterPassword) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const generatedCard = await generateCredentialCard(
        secretEntry,
        originalIndex,
      );
      setCard(generatedCard);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh credential';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card w="full" variant="elevated" borderRadius="lg">
        <CardBody p={4}>
          <VStack spacing={4} align="stretch">
            <Skeleton height="40px" />
            <Skeleton height="40px" />
            {secretEntry.secret && <Skeleton height="40px" />}
          </VStack>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card w="full" variant="elevated" borderRadius="lg">
        <CardBody p={4}>
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {error}
          </Alert>
          <Button onClick={handleRefresh} mt={3} size="sm">
            Retry
          </Button>
        </CardBody>
      </Card>
    );
  }

  if (!card) {
    return (
      <Card w="full" variant="elevated" borderRadius="lg">
        <CardBody p={4}>
          <Alert status="warning" borderRadius="md">
            <AlertIcon />
            Unable to generate credential data
          </Alert>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card w="full" variant="elevated" borderRadius="lg">
      <CardBody p={4}>
        <VStack spacing={4} align="stretch">
          {/* Header with refresh button */}
          <HStack justify="space-between">
            <Text fontSize="lg" fontWeight="semibold">
              Credential Details
            </Text>
            <Button
              size="sm"
              variant="ghost"
              leftIcon={<FiRefreshCw />}
              onClick={handleRefresh}
              isLoading={isLoading}
            >
              Refresh
            </Button>
          </HStack>

          {/* Username */}
          {card.username && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">
                Username
              </Text>
              <HStack>
                <Input
                  value={card.username}
                  isReadOnly
                  size="sm"
                  bg="gray.50"
                />
                <Button
                  size="sm"
                  leftIcon={<FiCopy />}
                  onClick={usernameClipboard.onCopy}
                  colorScheme={usernameClipboard.hasCopied ? 'green' : 'blue'}
                >
                  {usernameClipboard.hasCopied ? 'Copied!' : 'Copy'}
                </Button>
              </HStack>
            </Box>
          )}

          {/* Password */}
          <Box>
            <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">
              Generated Password
            </Text>
            <HStack>
              <Input
                value={card.password}
                type="password"
                isReadOnly
                size="sm"
                bg="gray.50"
                fontFamily="monospace"
              />
              <Button
                size="sm"
                leftIcon={<FiCopy />}
                onClick={passwordClipboard.onCopy}
                colorScheme={passwordClipboard.hasCopied ? 'green' : 'blue'}
              >
                {passwordClipboard.hasCopied ? 'Copied!' : 'Copy'}
              </Button>
            </HStack>
          </Box>

          {/* TOTP */}
          {card.totpCode && (
            <Box>
              <Text fontSize="sm" fontWeight="medium" mb={1} color="gray.600">
                TOTP Code
              </Text>
              <HStack>
                <Input
                  value={card.totpCode}
                  isReadOnly
                  size="sm"
                  bg="gray.50"
                  fontFamily="monospace"
                  letterSpacing="wider"
                />
                <Button
                  size="sm"
                  leftIcon={<FiCopy />}
                  onClick={totpClipboard.onCopy}
                  colorScheme={totpClipboard.hasCopied ? 'green' : 'blue'}
                >
                  {totpClipboard.hasCopied ? 'Copied!' : 'Copy'}
                </Button>
              </HStack>
              {card.totpTimeRemaining && (
                <Box mt={2}>
                  <TotpTimer timeRemaining={card.totpTimeRemaining} />
                </Box>
              )}
            </Box>
          )}
        </VStack>
      </CardBody>
    </Card>
  );
};
