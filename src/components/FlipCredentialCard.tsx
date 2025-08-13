import React, { useState } from 'react';
import { Box, Text } from '@chakra-ui/react';
import { FiRotateCw } from 'react-icons/fi';
import { SecretEntry } from '../crypto';
import { CredentialCard } from './CredentialCard';
import { CredentialActions } from './CredentialActions';

interface FlipCredentialCardProps {
  secretEntry: SecretEntry;
  originalIndex: number;
  masterPassword: string;
  onEdit: (index: number) => void;
  onCopyUsername?: (index: number) => void;
  onCopyPassword?: (index: number) => void;
  onCopyTotp?: (index: number) => void;
}

export const FlipCredentialCard: React.FC<FlipCredentialCardProps> = ({
  secretEntry,
  originalIndex,
  masterPassword,
  onEdit,
  onCopyUsername,
  onCopyPassword,
  onCopyTotp,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleCardClick = () => {
    setIsFlipped(!isFlipped);
  };

  const handleEdit = (index: number) => {
    onEdit(index);
  };

  const handleFlipToEdit = () => {
    setIsFlipped(true); // Show actions side first, then allow edit
  };

  return (
    <Box
      w="full"
      h="auto"
      position="relative"
      sx={{
        perspective: '1000px',
        minHeight: '80px', // Ensure consistent height
      }}
      onClick={handleCardClick}
      cursor="pointer"
    >
      {/* Flip Container */}
      <Box
        w="full"
        h="full"
        position="relative"
        sx={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s ease-in-out',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Side - CredentialCard */}
        <Box
          position="absolute"
          w="full"
          h="full"
          sx={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
          }}
        >
          <Box
            onClick={(e) => {
              e.stopPropagation(); // Prevent flip when clicking on action buttons
            }}
            position="relative"
          >
            <CredentialCard
              secretEntry={secretEntry}
              originalIndex={originalIndex}
              onEdit={handleFlipToEdit} // Flip to actions instead of navigating to edit
              onCopyUsername={onCopyUsername}
              onCopyPassword={onCopyPassword}
              onCopyTotp={onCopyTotp}
            />
            {/* Flip indicator */}
            <Box
              position="absolute"
              top={2}
              left={2}
              p={1}
              borderRadius="full"
              bg="blue.500"
              color="white"
              fontSize="xs"
              opacity={0.7}
              _hover={{ opacity: 1 }}
              transition="opacity 0.2s"
            >
              <FiRotateCw size={12} />
            </Box>
            {/* Click hint text */}
            <Box
              position="absolute"
              bottom={2}
              right={2}
              fontSize="xs"
              color="gray.500"
              opacity={0.6}
              _hover={{ opacity: 1 }}
              transition="opacity 0.2s"
            >
              <Text>Click to flip</Text>
            </Box>
          </Box>
        </Box>

        {/* Back Side - CredentialActions */}
        <Box
          position="absolute"
          w="full"
          h="full"
          sx={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
          onClick={(e) => {
            e.stopPropagation(); // Prevent flip when interacting with actions
          }}
        >
          {/* Add a wrapper to provide edit functionality */}
          <Box position="relative">
            <CredentialActions
              secretEntry={secretEntry}
              originalIndex={originalIndex}
              masterPassword={masterPassword}
            />
            {/* Flip back indicator */}
            <Box
              position="absolute"
              top={2}
              left={2}
              p={1}
              borderRadius="full"
              bg="gray.500"
              color="white"
              fontSize="xs"
              opacity={0.7}
              _hover={{ opacity: 1 }}
              transition="opacity 0.2s"
              cursor="pointer"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setIsFlipped(false);
              }}
            >
              <FiRotateCw size={12} />
            </Box>
            {/* Edit button overlay */}
            <Box position="absolute" top={4} right={16} zIndex={10}>
              <Box
                as="button"
                px={3}
                py={1}
                bg="blue.500"
                color="white"
                borderRadius="md"
                fontSize="sm"
                _hover={{ bg: 'blue.600' }}
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleEdit(originalIndex);
                }}
              >
                Edit
              </Box>
            </Box>
            {/* Click hint text for flip back */}
            <Box
              position="absolute"
              bottom={2}
              left={2}
              fontSize="xs"
              color="gray.500"
              opacity={0.6}
              _hover={{ opacity: 1 }}
              transition="opacity 0.2s"
              cursor="pointer"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                setIsFlipped(false);
              }}
            >
              <Text>Click to flip back</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};
