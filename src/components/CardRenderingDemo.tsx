import React from 'react';
import { VStack, Box, Text } from '@chakra-ui/react';
import { CredentialCardRenderer } from './CredentialCardRenderer';
import { CardRenderingToggle } from './CardRenderingToggle';
import { useRenderingPreferences } from '../hooks/useRenderingPreferences';
import { SecretEntry } from '../crypto';

// Sample test data
const sampleSecrets: SecretEntry[] = [
  {
    name: 'GitHub',
    secret: 'JBSWY3DPEHPK3PXP', // Base32 encoded secret for testing
    website: 'https://github.com',
    username: 'user@example.com',
    passwordLength: 16,
    includeSymbols: false,
  },
  {
    name: 'Google',
    secret: '',
    website: 'https://google.com',
    username: 'user@gmail.com',
    passwordLength: 20,
    includeSymbols: true,
  },
  {
    name: 'Work Email',
    secret: 'JBSWY3DPEHPK3PXP',
    website: 'https://company.com',
    username: 'user@company.com',
    passwordLength: 12,
    includeSymbols: false,
  },
  {
    name: 'Discord',
    secret: 'JBSWY3DPEHPK3PXP',
    website: 'https://discord.com',
    username: 'gamer123',
    passwordLength: 16,
    includeSymbols: true,
  },
  {
    name: 'Netflix',
    secret: '',
    website: 'https://netflix.com',
    username: 'user@example.com',
    passwordLength: 14,
    includeSymbols: false,
  },
  {
    name: 'Banking',
    secret: 'JBSWY3DPEHPK3PXP',
    website: 'https://mybank.com',
    username: 'customer123',
    passwordLength: 18,
    includeSymbols: true,
  },
  {
    name: 'AWS Console',
    secret: 'JBSWY3DPEHPK3PXP',
    website: 'https://aws.amazon.com',
    username: 'admin@company.com',
    passwordLength: 20,
    includeSymbols: true,
  },
  {
    name: 'Spotify',
    secret: '',
    website: 'https://spotify.com',
    username: 'musiclover@email.com',
    passwordLength: 12,
    includeSymbols: false,
  },
  {
    name: 'Very Long Service Name That Should Be Truncated Properly',
    secret: 'JBSWY3DPEHPK3PXP',
    website:
      'https://very-long-domain-name-that-might-cause-overflow-issues.example.com',
    username:
      'very.long.username.that.might.cause.layout.issues@company-with-long-name.com',
    passwordLength: 16,
    includeSymbols: true,
  },
];

export const CardRenderingDemo: React.FC = () => {
  const { cardRenderingMode } = useRenderingPreferences();
  const masterPassword = 'demo-password'; // For demo purposes

  return (
    <Box p={4} w="full">
      <VStack spacing={6}>
        <VStack spacing={4}>
          <Text fontSize="xl" fontWeight="bold" textAlign="center">
            Credential Card Demo
          </Text>
          <Text color="gray.600" textAlign="center" fontSize="sm">
            Switch between flip cards and OpenAI-style cards to see the
            different rendering modes.
          </Text>
          <CardRenderingToggle />
        </VStack>

        <VStack spacing={4} w="full">
          <Text fontSize="md" fontWeight="semibold">
            Sample Credentials (
            {cardRenderingMode === 'flip' ? 'Flip' : 'OpenAI'} Style)
          </Text>

          {sampleSecrets.map((secret, index) => (
            <CredentialCardRenderer
              key={`${secret.name}-${index}`}
              secretEntry={secret}
              originalIndex={index}
              masterPassword={masterPassword}
              onEdit={(idx) => {
                // eslint-disable-next-line no-console
                console.log('Edit clicked for index:', idx);
              }}
              renderingMode={cardRenderingMode}
              compact={cardRenderingMode === 'openai'}
            />
          ))}
        </VStack>
      </VStack>
    </Box>
  );
};
