import React from 'react';
import {
  Box,
  HStack,
  Text,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';

interface TotpTimerProps {
  timeRemaining: number;
}

export const TotpTimer: React.FC<TotpTimerProps> = ({ timeRemaining }) => {
  return (
    <Box
      w="full"
      bg="white"
      borderRadius="md"
      borderWidth="1px"
      p={2}
      shadow="sm"
    >
      <HStack justify="center" spacing={2}>
        <Text fontSize="xs" color="gray.600">
          🕐 2FA codes refresh in
        </Text>
        <CircularProgress
          value={(timeRemaining / 30) * 100}
          color={timeRemaining <= 5 ? 'red.500' : 'green.500'}
          size="20px"
          thickness="8px"
        >
          <CircularProgressLabel fontSize="2xs">
            {timeRemaining}
          </CircularProgressLabel>
        </CircularProgress>
        <Text fontSize="xs" color="gray.600">
          seconds
        </Text>
      </HStack>
    </Box>
  );
};
