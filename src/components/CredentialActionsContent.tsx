import React, { useEffect } from 'react';
import {
  VStack,
  HStack,
  Input,
  Button,
  useClipboard,
  Skeleton,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { SecretEntry } from '../crypto';
import { useCredentialGenerator } from '../hooks/useCredentialGenerator';
import { TotpTimer } from './TotpTimer';

interface CredentialActionsContentProps {
  secretEntry: SecretEntry;
  originalIndex: number;
  masterPassword: string;
}

export const CredentialActionsContent: React.FC<
  CredentialActionsContentProps
> = ({ secretEntry, originalIndex, masterPassword }) => {
  const { card, isLoading, error, generateCredentialCard } =
    useCredentialGenerator(masterPassword);

  const passwordClipboard = useClipboard(card?.password || '');
  const totpClipboard = useClipboard(card?.totpCode || '');
  const usernameClipboard = useClipboard(card?.username || '');

  // Generate credential card on mount
  useEffect(() => {
    const generateCard = async () => {
      await generateCredentialCard(secretEntry, originalIndex);
    };

    generateCard();
  }, [secretEntry, originalIndex, generateCredentialCard]);

  if (isLoading) {
    return (
      <VStack spacing={3} align="stretch" h="full" justify="center">
        <Skeleton height="32px" />
        <Skeleton height="32px" />
        {secretEntry.secret && <Skeleton height="32px" />}
      </VStack>
    );
  }

  if (error) {
    return (
      <VStack spacing={3} align="stretch" h="full" justify="center">
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </VStack>
    );
  }

  if (!card) {
    return (
      <VStack spacing={3} align="stretch" h="full" justify="center">
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Unable to generate credential data
        </Alert>
      </VStack>
    );
  }

  return (
    <VStack spacing={3} align="stretch" h="full" justify="center">
      {/* Username */}
      {card.username && (
        <HStack spacing={2}>
          <Input
            value={card.username}
            placeholder="Username"
            isReadOnly
            size="sm"
            bg="gray.50"
            flex={1}
            fontSize="sm"
          />
          <Button
            size="sm"
            onClick={usernameClipboard.onCopy}
            colorScheme={usernameClipboard.hasCopied ? 'green' : 'gray'}
            variant={usernameClipboard.hasCopied ? 'solid' : 'outline'}
            minW="60px"
          >
            {usernameClipboard.hasCopied ? '✓' : 'Copy'}
          </Button>
        </HStack>
      )}

      {/* Password */}
      <HStack spacing={2}>
        <Input
          value={card.password}
          type="password"
          placeholder="Password"
          isReadOnly
          size="sm"
          bg="gray.50"
          fontFamily="monospace"
          flex={1}
          fontSize="sm"
        />
        <Button
          size="sm"
          onClick={passwordClipboard.onCopy}
          colorScheme={passwordClipboard.hasCopied ? 'green' : 'blue'}
          variant={passwordClipboard.hasCopied ? 'solid' : 'outline'}
          minW="60px"
        >
          {passwordClipboard.hasCopied ? '✓' : 'Copy'}
        </Button>
      </HStack>

      {/* TOTP */}
      {card.totpCode && (
        <VStack spacing={1} align="stretch">
          <HStack spacing={2}>
            <Input
              value={card.totpCode}
              placeholder="TOTP Code"
              isReadOnly
              size="sm"
              bg="gray.50"
              fontFamily="monospace"
              letterSpacing="wider"
              flex={1}
              fontSize="sm"
              fontWeight="bold"
            />
            <Button
              size="sm"
              onClick={totpClipboard.onCopy}
              colorScheme={totpClipboard.hasCopied ? 'green' : 'orange'}
              variant={totpClipboard.hasCopied ? 'solid' : 'outline'}
              minW="60px"
            >
              {totpClipboard.hasCopied ? '✓' : 'Copy'}
            </Button>
          </HStack>
          {card.totpTimeRemaining && (
            <TotpTimer timeRemaining={card.totpTimeRemaining} />
          )}
        </VStack>
      )}
    </VStack>
  );
};
