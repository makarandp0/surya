import React, { useState } from 'react';
import { Box, IconButton } from '@chakra-ui/react';
import { FiRotateCw } from 'react-icons/fi';
import { SecretEntry } from '../crypto';
import { CredentialCard } from './CredentialCard';
import { CredentialActions } from './CredentialActions';

interface FlipCredentialCardProps {
  secretEntry: SecretEntry;
  originalIndex: number;
  masterPassword: string;
  onEdit: (index: number) => void;
}

export const FlipCredentialCard: React.FC<FlipCredentialCardProps> = ({
  secretEntry,
  originalIndex,
  masterPassword,
  onEdit,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <Box
      w="full"
      h="180px"
      position="relative"
      sx={{
        perspective: '1000px',
      }}
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
          h="180px"
          sx={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(0deg)',
          }}
        >
          <CredentialCard
            secretEntry={secretEntry}
            originalIndex={originalIndex}
            onEdit={onEdit}
          />
        </Box>

        {/* Back Side - CredentialActions */}
        <Box
          position="absolute"
          w="full"
          h="180px"
          sx={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <CredentialActions
            secretEntry={secretEntry}
            originalIndex={originalIndex}
            masterPassword={masterPassword}
          />
        </Box>
      </Box>

      {/* Floating Flip Button */}
      <IconButton
        aria-label={isFlipped ? 'Flip to front' : 'Flip to back'}
        icon={<FiRotateCw />}
        size="sm"
        position="absolute"
        top={2}
        right={2}
        zIndex={10}
        colorScheme="blue"
        variant="solid"
        borderRadius="full"
        onClick={handleFlip}
        transform={isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'}
        transition="transform 0.6s ease-in-out"
      />
    </Box>
  );
};
