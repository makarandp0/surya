import React, { useMemo } from 'react';
import {
  VStack,
  HStack,
  Text,
  Box,
  Avatar,
  Tag,
  TagLabel,
  Tooltip,
  useColorModeValue,
  Wrap,
  Divider,
  Spacer,
} from '@chakra-ui/react';
import { FiGlobe, FiUser, FiShield, FiClock } from 'react-icons/fi';
import { SecretEntry, normalizeDomainFromUrl } from '../crypto';

interface CredentialCardContentProps {
  secretEntry: SecretEntry;
}

export const CredentialCardContent: React.FC<CredentialCardContentProps> = ({
  secretEntry,
}) => {
  // Derived display fields
  const domain = secretEntry.website
    ? normalizeDomainFromUrl(secretEntry.website)
    : '';
  const title =
    secretEntry.name || domain || secretEntry.username || 'Credential';

  const accentColor = useMemo(
    () => secretEntry.color || '#3182ce',
    [secretEntry.color],
  );

  // const avatarBg = useColorModeValue('gray.100', 'gray.700'); // reserved if future theming needed
  const subtleFg = useColorModeValue('gray.600', 'gray.400');
  const strongFg = useColorModeValue('gray.800', 'gray.100');
  const borderColor = useColorModeValue('gray.100', 'whiteAlpha.200');

  const initial = (title || '?').trim().charAt(0).toUpperCase();

  type FeatureColor = 'blue' | 'green' | 'purple' | 'orange';
  interface FeatureDef {
    label: string;
    icon: React.ReactElement;
    color: FeatureColor;
  }
  const features: FeatureDef[] = [
    { label: 'Derived Password', icon: <FiShield />, color: 'blue' },
  ];
  if (secretEntry.secret) {
    features.push({ label: 'TOTP Enabled', icon: <FiClock />, color: 'green' });
  }

  return (
    <HStack h="full" align="stretch" spacing={4} position="relative">
      {/* Accent Bar */}
      <Box
        w="3px"
        borderRadius="full"
        bg={accentColor}
        alignSelf="stretch"
        boxShadow="0 0 0 1px rgba(0,0,0,0.04)"
      />

      {/* Main Content */}
      <VStack spacing={3} align="stretch" flex={1} overflow="hidden">
        <HStack align="flex-start" spacing={3} w="full">
          <Avatar
            name={title}
            size="sm"
            bg={accentColor}
            color="white"
            fontSize="sm"
            icon={<Text fontSize="sm">{initial}</Text>}
          />
          <VStack spacing={0} align="flex-start" flex={1} minW={0}>
            <Tooltip label={title} openDelay={400} hasArrow>
              <Text
                fontSize="lg"
                fontWeight="semibold"
                color={strongFg}
                lineHeight="1.2"
                noOfLines={1}
              >
                {title}
              </Text>
            </Tooltip>
            {domain && (
              <HStack spacing={1} color={subtleFg} maxW="100%">
                <Box as={FiGlobe} boxSize={3.5} />
                <Text fontSize="xs" noOfLines={1}>
                  {domain}
                </Text>
              </HStack>
            )}
          </VStack>
        </HStack>

        {/* Divider (visual separation) */}
        <Divider borderColor={borderColor} />

        <VStack spacing={2} align="stretch" flex={1} overflow="hidden">
          {secretEntry.username && (
            <HStack spacing={2} color={subtleFg} minW={0}>
              <Box as={FiUser} boxSize={4} />
              <Tooltip label={secretEntry.username} openDelay={400} hasArrow>
                <Text fontSize="sm" noOfLines={1} flex={1}>
                  {secretEntry.username}
                </Text>
              </Tooltip>
            </HStack>
          )}

          {/* Feature Tags */}
          {/* Using shouldWrapChildren means each direct child becomes a WrapItem (li). Avoid manually adding WrapItem to prevent nested li */}
          <Wrap shouldWrapChildren spacing={2}>
            {features.map((f) => (
              <Tag
                key={f.label}
                size="sm"
                colorScheme={f.color}
                variant="subtle"
                borderRadius="full"
                display="inline-flex"
                alignItems="center"
                gap={1}
              >
                <Box boxSize={3.5}>{f.icon}</Box>
                <TagLabel>{f.label}</TagLabel>
              </Tag>
            ))}
            <Spacer />
          </Wrap>
        </VStack>
      </VStack>
    </HStack>
  );
};
