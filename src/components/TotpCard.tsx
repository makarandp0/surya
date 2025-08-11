import React from 'react';
import {
  Box,
  Card,
  CardBody,
  CircularProgress,
  CircularProgressLabel,
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';

interface TotpCardProps {
  name: string;
  code: string;
  timeRemaining: number;
  color?: string;
  onCopyCode: (code: string, name: string) => void;
}

const formatCode = (code: string) =>
  code ? code.replace(/(\d{3})(?=\d)/g, '$1 ').trim() : '';

export const TotpCard: React.FC<TotpCardProps> = ({
  name,
  code,
  timeRemaining,
  color,
  onCopyCode,
}) => {
  const getProgressColor = (remaining: number) => {
    if (remaining <= 5) {
      return 'red.400';
    }
    if (remaining <= 10) {
      return 'orange.400';
    }
    return 'green.400';
  };

  return (
    <Card variant="elevated" size="sm" w="full">
      <CardBody p={3}>
        <VStack spacing={2}>
          {/* Account Header */}
          <HStack justify="space-between" w="full">
            <HStack maxW="70%">
              {color && (
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={color}
                  border="1px solid"
                  borderColor="gray.300"
                />
              )}
              <Text
                fontWeight="semibold"
                fontSize="sm"
                color="gray.800"
                noOfLines={1}
                title={name}
              >
                {name}
              </Text>
            </HStack>
            <CircularProgress
              value={(timeRemaining / 30) * 100}
              size="28px"
              color={getProgressColor(timeRemaining)}
              trackColor="gray.200"
            >
              <CircularProgressLabel fontSize="xs" fontWeight="bold">
                {timeRemaining}
              </CircularProgressLabel>
            </CircularProgress>
          </HStack>

          {/* TOTP Code Display */}
          <HStack w="full" spacing={2}>
            <Input
              readOnly
              value={formatCode(code)}
              placeholder="Generating..."
              fontSize="lg"
              fontFamily="mono"
              fontWeight="bold"
              letterSpacing="0.15em"
              textAlign="center"
              cursor="pointer"
              bg="gray.100"
              borderColor="gray.300"
              _hover={{ bg: 'blue.50', borderColor: 'blue.300' }}
              _focus={{ bg: 'white', borderColor: 'blue.400' }}
              onClick={() => onCopyCode(code, name)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onCopyCode(code, name);
                }
              }}
              title="Click to copy"
              h="10"
              size="sm"
              tabIndex={0}
            />
            <IconButton
              aria-label={`Copy code for ${name}`}
              icon={<CopyIcon />}
              onClick={() => onCopyCode(code, name)}
              colorScheme="blue"
              variant="outline"
              size="sm"
              isDisabled={!code}
            />
          </HStack>
        </VStack>
      </CardBody>
    </Card>
  );
};
