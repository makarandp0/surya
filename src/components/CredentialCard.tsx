import React from 'react';
import {
  Box,
  Button,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  useClipboard,
} from '@chakra-ui/react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { CredentialCard } from '../types/credential';

interface CredentialCardProps {
  card: CredentialCard;
}

export const CredentialCardComponent: React.FC<CredentialCardProps> = ({
  card,
}) => {
  const passwordClipboard = useClipboard(card.password);
  const totpClipboard = useClipboard(card.totpCode || '');

  const formatCode = (code: string) =>
    code ? code.replace(/(\d{3})(?=\d)/g, '$1 ').trim() : '';

  return (
    <Box
      w="full"
      bg="white"
      borderRadius="md"
      borderWidth="1px"
      p={3}
      shadow="sm"
    >
      <VStack spacing={2}>
        {/* Header with website and username */}
        <HStack justify="space-between" w="full">
          <VStack spacing={0} align="start" flex={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">
              🎯 {card.domain}
            </Text>
            {card.username && (
              <Text fontSize="xs" color="gray.600">
                👤 {card.username}
              </Text>
            )}
            <Text fontSize="2xs" color="gray.500">
              {card.secretEntry.name}
            </Text>
          </VStack>
          {card.secretEntry.color && (
            <Box
              w={3}
              h={3}
              borderRadius="full"
              bg={card.secretEntry.color}
              flexShrink={0}
            />
          )}
        </HStack>

        {/* Password */}
        <Box w="full">
          <InputGroup size="sm">
            <Input
              readOnly
              value={card.password}
              fontFamily="mono"
              fontSize="sm"
              letterSpacing="0.05em"
              bg="gray.50"
              borderColor="gray.200"
              cursor="pointer"
              onClick={passwordClipboard.onCopy}
              title="Click to copy password"
              pr="70px"
            />
            <InputRightElement width="60px">
              <Button
                size="xs"
                colorScheme={passwordClipboard.hasCopied ? 'green' : 'blue'}
                variant="outline"
                leftIcon={
                  passwordClipboard.hasCopied ? <CheckIcon /> : <CopyIcon />
                }
                onClick={passwordClipboard.onCopy}
              >
                {passwordClipboard.hasCopied ? 'Copied!' : 'Copy'}
              </Button>
            </InputRightElement>
          </InputGroup>
        </Box>

        {/* TOTP Code */}
        {card.totpCode && (
          <Box w="full">
            <InputGroup size="sm">
              <Input
                readOnly
                value={formatCode(card.totpCode)}
                fontFamily="mono"
                fontSize="lg"
                fontWeight="bold"
                letterSpacing="0.15em"
                textAlign="center"
                bg="gray.50"
                borderColor="gray.200"
                cursor="pointer"
                onClick={totpClipboard.onCopy}
                title="Click to copy 2FA code"
                pr="70px"
              />
              <InputRightElement width="60px">
                <Button
                  size="xs"
                  colorScheme={totpClipboard.hasCopied ? 'green' : 'green'}
                  variant="outline"
                  leftIcon={
                    totpClipboard.hasCopied ? <CheckIcon /> : <CopyIcon />
                  }
                  onClick={totpClipboard.onCopy}
                >
                  {totpClipboard.hasCopied ? 'Copied!' : 'Copy'}
                </Button>
              </InputRightElement>
            </InputGroup>
          </Box>
        )}
      </VStack>
    </Box>
  );
};
