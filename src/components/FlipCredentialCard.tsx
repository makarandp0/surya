import React, { useState } from 'react';
import {
  Box,
  IconButton,
  Card,
  CardHeader,
  CardBody,
  HStack,
  Text,
  Spacer,
} from '@chakra-ui/react';
import { FiEdit, FiRotateCw } from 'react-icons/fi';
import { SecretEntry, normalizeDomainFromUrl } from '../crypto';
import { CredentialCardContent } from './CredentialCardContent';
import { CredentialActionsContent } from './CredentialActionsContent';

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
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(originalIndex);
  };

  // Extract title for the header
  const domain = secretEntry.website
    ? normalizeDomainFromUrl(secretEntry.website)
    : '';
  const title =
    secretEntry.name || domain || secretEntry.username || 'Credential';

  return (
    <Card w="full" h="180px" variant="elevated" borderRadius="lg">
      {/* Card Header with Flip Button */}
      <CardHeader p={3} pb={0}>
        <HStack align="center">
          <Text
            fontSize="xs"
            fontWeight="medium"
            color="gray.600"
            noOfLines={1}
          >
            {title}
          </Text>
          <Spacer />
          <Text fontSize="xs" color="gray.400" mr={2}>
            {isFlipped ? 'Actions' : 'Info'}
          </Text>
          <IconButton
            aria-label={isFlipped ? 'Show info' : 'Show actions'}
            icon={<FiEdit />}
            size="lg"
            onClick={handleEditClick}
            colorScheme="blue"
            variant="ghost"
            borderRadius="full"
          />
          <IconButton
            aria-label={isFlipped ? 'Show info' : 'Show actions'}
            icon={<FiRotateCw />}
            size="lg"
            onClick={handleFlip}
            colorScheme="blue"
            variant="ghost"
            borderRadius="full"
          />
        </HStack>
      </CardHeader>

      {/* Flippable Card Body */}
      <CardBody p={4} h="calc(100% - 60px)" position="relative">
        <Box
          w="full"
          h="full"
          position="relative"
          sx={{
            perspective: '1000px',
          }}
        >
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
            {/* Front Side - CredentialCard Content */}
            <Box
              position="absolute"
              w="full"
              h="full"
              sx={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)',
              }}
            >
              <CredentialCardContent secretEntry={secretEntry} />
            </Box>

            {/* Back Side - CredentialActions Content */}
            <Box
              position="absolute"
              w="full"
              h="full"
              sx={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <CredentialActionsContent
                secretEntry={secretEntry}
                originalIndex={originalIndex}
                masterPassword={masterPassword}
              />
            </Box>
          </Box>
        </Box>
      </CardBody>
    </Card>
  );
};
