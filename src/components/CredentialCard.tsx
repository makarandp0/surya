import React from 'react';
import {
  Box,
  Button,
  Grid,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  Wrap,
  WrapItem,
  useClipboard,
} from '@chakra-ui/react';
import { CopyIcon, CheckIcon } from '@chakra-ui/icons';
import { CredentialCard } from '../types/credential';

interface CredentialCardProps {
  card: CredentialCard;
  variant?: 'grid' | 'chips' | 'microLabels';
}

export const CredentialCardComponent: React.FC<CredentialCardProps> = ({
  card,
  variant = 'grid',
}) => {
  const passwordClipboard = useClipboard(card.password);
  const totpClipboard = useClipboard(card.totpCode || '');

  const formatCode = (code: string) =>
    code ? code.replace(/(\d{3})(?=\d)/g, '$1 ').trim() : '';

  const title =
    card.secretEntry.name || card.domain || card.username || 'Credential';

  const subtitle = (() => {
    if (card.username && card.domain) {
      return `${card.username}@${card.domain}`;
    }
    return card.username || card.domain || '';
  })();

  const PasswordInput = (
    <InputGroup size="sm">
      <Input
        readOnly
        value={card.password}
        fontFamily="mono"
        fontSize="sm"
        letterSpacing="0.03em"
        textAlign="left"
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
          leftIcon={passwordClipboard.hasCopied ? <CheckIcon /> : <CopyIcon />}
          onClick={passwordClipboard.onCopy}
        >
          {passwordClipboard.hasCopied ? 'Copied!' : 'Copy'}
        </Button>
      </InputRightElement>
    </InputGroup>
  );

  const TotpInput = card.totpCode ? (
    <InputGroup size="sm">
      <Input
        readOnly
        value={formatCode(card.totpCode)}
        fontFamily="mono"
        fontSize="sm"
        fontWeight="semibold"
        letterSpacing="0.12em"
        textAlign="left"
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
          leftIcon={totpClipboard.hasCopied ? <CheckIcon /> : <CopyIcon />}
          onClick={totpClipboard.onCopy}
        >
          {totpClipboard.hasCopied ? 'Copied!' : 'Copy'}
        </Button>
      </InputRightElement>
    </InputGroup>
  ) : null;

  return (
    <Box
      w="full"
      bg="white"
      borderRadius="md"
      borderWidth="1px"
      p={3}
      shadow="sm"
    >
      <VStack spacing={2} align="stretch">
        {/* Header - minimal labels, graceful fallbacks */}
        <HStack justify="space-between" w="full">
          <VStack spacing={0} align="start" flex={1}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">
              {title}
            </Text>
            {subtitle && (
              <Text fontSize="xs" color="gray.600">
                {subtitle}
              </Text>
            )}
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

        {/* Variants */}
        {variant === 'grid' && (
          <Grid
            w="full"
            templateColumns={card.totpCode ? '1fr 1fr' : '1fr'}
            gap={2}
          >
            {PasswordInput}
            {TotpInput}
          </Grid>
        )}

        {variant === 'chips' && (
          <VStack spacing={2} align="stretch">
            {(card.username || card.domain) && (
              <Wrap spacing="6px">
                {card.username && (
                  <WrapItem>
                    <Box
                      px="2"
                      py="0.5"
                      bg="gray.100"
                      borderRadius="md"
                      fontSize="xs"
                    >
                      👤 {card.username}
                    </Box>
                  </WrapItem>
                )}
                {card.domain && (
                  <WrapItem>
                    <Box
                      px="2"
                      py="0.5"
                      bg="gray.100"
                      borderRadius="md"
                      fontSize="xs"
                    >
                      🌐 {card.domain}
                    </Box>
                  </WrapItem>
                )}
              </Wrap>
            )}

            <HStack w="full" spacing={2} align="stretch">
              <Box
                onClick={passwordClipboard.onCopy}
                cursor="pointer"
                px="2.5"
                py="1.5"
                bg="gray.50"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                fontFamily="mono"
                fontSize="sm"
                flex="1"
                title="Click to copy password"
              >
                {card.password}
              </Box>
              {card.totpCode && (
                <Box
                  onClick={totpClipboard.onCopy}
                  cursor="pointer"
                  px="2.5"
                  py="1.5"
                  bg="gray.50"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="md"
                  fontFamily="mono"
                  fontSize="sm"
                  fontWeight="semibold"
                  letterSpacing="0.12em"
                  flex="1"
                  title="Click to copy 2FA code"
                >
                  {formatCode(card.totpCode)}
                </Box>
              )}
            </HStack>
          </VStack>
        )}

        {variant === 'microLabels' && (
          <VStack w="full" spacing={1} align="stretch">
            {card.totpCode && (
              <HStack justify="space-between" w="full">
                <Text fontSize="2xs" color="gray.500">
                  Password
                </Text>
                <Text fontSize="2xs" color="gray.500">
                  2FA
                </Text>
              </HStack>
            )}
            <Grid
              w="full"
              templateColumns={card.totpCode ? '1fr 1fr' : '1fr'}
              gap={2}
            >
              {PasswordInput}
              {TotpInput}
            </Grid>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};
