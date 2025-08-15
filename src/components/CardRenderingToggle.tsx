import React from 'react';
import {
  Box,
  HStack,
  Text,
  IconButton,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiRotateCw, FiGrid } from 'react-icons/fi';
import { useRenderingPreferences } from '../hooks/useRenderingPreferences';
import { type CardRenderingMode } from '../contexts/renderingPreferencesTypes';

export const CardRenderingToggle: React.FC = () => {
  const { cardRenderingMode, setCardRenderingMode } = useRenderingPreferences();
  const bgColor = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const handleToggle = () => {
    const newMode: CardRenderingMode =
      cardRenderingMode === 'flip' ? 'openai' : 'flip';
    setCardRenderingMode(newMode);
  };

  return (
    <Box
      bg={bgColor}
      border="1px"
      borderColor={borderColor}
      borderRadius="md"
      px={3}
      py={2}
      shadow="sm"
    >
      <HStack spacing={3} align="center">
        <Text fontSize="sm" color="gray.600" fontWeight="medium">
          Card Style:
        </Text>

        <HStack spacing={1}>
          <Tooltip
            label={
              cardRenderingMode === 'flip'
                ? 'Currently using Flip Cards'
                : 'Switch to Flip Cards'
            }
            hasArrow
          >
            <IconButton
              aria-label="Flip Card Mode"
              icon={<FiRotateCw />}
              size="sm"
              variant={cardRenderingMode === 'flip' ? 'solid' : 'ghost'}
              colorScheme={cardRenderingMode === 'flip' ? 'blue' : 'gray'}
              onClick={cardRenderingMode !== 'flip' ? handleToggle : undefined}
            />
          </Tooltip>

          <Tooltip
            label={
              cardRenderingMode === 'openai'
                ? 'Currently using OpenAI Cards'
                : 'Switch to OpenAI Cards'
            }
            hasArrow
          >
            <IconButton
              aria-label="OpenAI Card Mode"
              icon={<FiGrid />}
              size="sm"
              variant={cardRenderingMode === 'openai' ? 'solid' : 'ghost'}
              colorScheme={cardRenderingMode === 'openai' ? 'blue' : 'gray'}
              onClick={
                cardRenderingMode !== 'openai' ? handleToggle : undefined
              }
            />
          </Tooltip>
        </HStack>

        <Text fontSize="xs" color="gray.500">
          {cardRenderingMode === 'flip' ? 'Flip' : 'OpenAI'} Style
        </Text>
      </HStack>
    </Box>
  );
};
