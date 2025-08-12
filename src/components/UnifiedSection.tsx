import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  VStack,
  useToast,
  useClipboard,
  CircularProgress,
  CircularProgressLabel,
  Alert,
  AlertIcon,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import {
  SearchIcon,
  CloseIcon,
  CopyIcon,
  CheckIcon,
  RepeatIcon,
} from '@chakra-ui/icons';
import {
  derivePassword,
  generateTOTP,
  normalizeDomainFromUrl,
  SecretEntry,
} from '../crypto';
import { fetchActiveTabDomain } from '../utils/browser';
import { useFuzzyFilter } from '../hooks/useFuzzyFilter';

interface UnifiedSectionProps {
  masterPassword: string;
  secrets: SecretEntry[];
  onLogout: () => void;
}

interface CredentialCard {
  secretEntry: SecretEntry;
  domain: string;
  username: string;
  password: string;
  totpCode?: string;
  totpTimeRemaining?: number;
}

export const UnifiedSection: React.FC<UnifiedSectionProps> = ({
  masterPassword,
  secrets,
  onLogout,
}) => {
  const toast = useToast();

  // Main domain input and filter query
  const [domain, setDomain] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Generated credential cards
  const [credentialCards, setCredentialCards] = useState<CredentialCard[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // TOTP timing
  const [totpTimeRemaining, setTotpTimeRemaining] = useState(30);

  // Fuzzy filter for secrets
  const { filteredIndices, filteredCount } = useFuzzyFilter(
    secrets,
    filterQuery,
  );

  // Auto-fetch domain on mount
  useEffect(() => {
    const fetchDomain = async () => {
      const d = await fetchActiveTabDomain();
      if (d) {
        setDomain(d);
      }
    };
    fetchDomain();
  }, []);

  // Find matching secrets for a domain
  const findSecretsForDomain = useCallback(
    (targetDomain: string): SecretEntry[] => {
      const normalizedTarget =
        normalizeDomainFromUrl(targetDomain).toLowerCase();

      return secrets.filter((secret) => {
        // Check if secret has explicit website field that matches
        if (secret.website) {
          const normalizedWebsite = normalizeDomainFromUrl(
            secret.website,
          ).toLowerCase();
          return normalizedWebsite === normalizedTarget;
        }

        // Fallback to name-based matching
        const secretName = secret.name.toLowerCase();
        return (
          secretName.includes(normalizedTarget) ||
          normalizedTarget.includes(secretName.split(':')[0]) ||
          secretName.includes(normalizedTarget.replace(/\./g, ''))
        );
      });
    },
    [secrets],
  );

  const generateCredentialsForDomain = useCallback(
    async (targetDomain: string) => {
      if (!targetDomain || !masterPassword) {
        setCredentialCards([]);
        return;
      }

      setIsGenerating(true);
      try {
        const normalizedDomain = normalizeDomainFromUrl(targetDomain);
        const matchingSecrets = findSecretsForDomain(normalizedDomain);

        const cards: CredentialCard[] = [];

        for (const secretEntry of matchingSecrets) {
          const username = secretEntry.username || '';
          const passwordLength = secretEntry.passwordLength ?? 16;
          const includeSymbols = secretEntry.includeSymbols ?? false;

          // Generate password using both domain and username
          const password = await derivePassword({
            masterKey: masterPassword,
            domain: normalizedDomain,
            username,
            length: passwordLength,
            includeSymbols,
          });

          let totpCode: string | undefined;
          let totpTimeRemaining: number | undefined;

          if (secretEntry.secret) {
            try {
              const totpResult = await generateTOTP({
                secret: secretEntry.secret,
              });
              totpCode = totpResult.code;
              totpTimeRemaining = totpResult.timeRemaining;
            } catch (error) {
              // eslint-disable-next-line no-console
              console.warn('Failed to generate TOTP:', error);
              toast({
                status: 'warning',
                title: 'TOTP Generation Failed',
                description: `Could not generate 2FA code for ${secretEntry.name}`,
              });
            }
          }

          cards.push({
            secretEntry,
            domain: normalizedDomain,
            username,
            password,
            totpCode,
            totpTimeRemaining,
          });
        }

        setCredentialCards(cards);
      } catch (error) {
        toast({
          status: 'error',
          title: 'Generation Failed',
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [masterPassword, findSecretsForDomain, toast],
  );

  // Handle domain change
  useEffect(() => {
    if (domain) {
      generateCredentialsForDomain(domain);
    } else {
      setCredentialCards([]);
    }
  }, [domain, generateCredentialsForDomain]);

  // TOTP timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setTotpTimeRemaining(remaining);

      // Regenerate TOTP if it's about to expire and we have credentials
      if (remaining === 30 && credentialCards.length > 0) {
        generateCredentialsForDomain(domain);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [credentialCards, domain, generateCredentialsForDomain]);

  const handleRefreshDomain = async () => {
    const d = await fetchActiveTabDomain();
    if (d) {
      setDomain(d);
    }
  };

  const handleSecretClick = (secret: SecretEntry) => {
    // Use explicit website field if available, otherwise extract from name
    let targetDomain = '';
    if (secret.website) {
      targetDomain = secret.website;
    } else {
      const parts = secret.name.split(':');
      const domainPart = parts[0].toLowerCase();
      targetDomain = domainPart + '.com'; // Simple heuristic
    }
    setDomain(targetDomain);
    setFilterQuery('');
  };

  return (
    <VStack spacing={2} w="full">
      {/* Header with logout */}
      <HStack justify="space-between" w="full" mb={1}>
        <Text fontSize="md" fontWeight="bold" color="gray.800">
          🔓 Vault ({secrets.length})
        </Text>
        <Button size="xs" variant="outline" onClick={onLogout}>
          Logout
        </Button>
      </HStack>

      {/* Main Domain Input */}
      <Box
        w="full"
        bg="white"
        borderRadius="md"
        borderWidth="1px"
        p={3}
        shadow="sm"
      >
        <FormControl>
          <FormLabel
            fontSize="xs"
            fontWeight="semibold"
            color="gray.700"
            mb={1}
          >
            🌐 Website
          </FormLabel>
          <HStack spacing={2}>
            <Input
              placeholder="example.com"
              value={domain}
              onChange={(e) =>
                setDomain(normalizeDomainFromUrl(e.target.value))
              }
              bg="gray.50"
              borderColor="gray.200"
              _focus={{ borderColor: 'blue.400', bg: 'white' }}
              size="sm"
            />
            <IconButton
              aria-label="Use active tab"
              icon={<RepeatIcon />}
              onClick={handleRefreshDomain}
              colorScheme="blue"
              variant="outline"
              size="sm"
            />
          </HStack>
          {isGenerating && (
            <Text fontSize="xs" color="gray.600" mt={1}>
              Generating credentials...
            </Text>
          )}
        </FormControl>
      </Box>

      {/* Generated Credential Cards */}
      {credentialCards.length > 0 && (
        <VStack spacing={2} w="full">
          {/* Global TOTP Timer - show only if any card has TOTP */}
          {credentialCards.some((card) => card.totpCode) && (
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
                  value={(totpTimeRemaining / 30) * 100}
                  color={totpTimeRemaining <= 5 ? 'red.500' : 'green.500'}
                  size="20px"
                  thickness="8px"
                >
                  <CircularProgressLabel fontSize="2xs">
                    {totpTimeRemaining}
                  </CircularProgressLabel>
                </CircularProgress>
                <Text fontSize="xs" color="gray.600">
                  seconds
                </Text>
              </HStack>
            </Box>
          )}

          {credentialCards.map((card, index) => (
            <CredentialCardComponent
              key={`${card.secretEntry.name}-${index}`}
              card={card}
            />
          ))}
        </VStack>
      )}

      {/* No matches found */}
      {domain && credentialCards.length === 0 && !isGenerating && (
        <Box
          w="full"
          bg="white"
          borderRadius="md"
          borderWidth="1px"
          p={3}
          shadow="sm"
        >
          <Alert status="info" borderRadius="md" fontSize="xs" py={2}>
            <AlertIcon boxSize={3} />
            No secrets found for {domain}
          </Alert>
        </Box>
      )}

      {/* Secrets Browser */}
      <Box
        w="full"
        bg="white"
        borderRadius="md"
        borderWidth="1px"
        p={3}
        shadow="sm"
      >
        <Accordion allowToggle>
          <AccordionItem border="none">
            <AccordionButton px={0} py={1}>
              <Box flex="1" textAlign="left">
                <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                  📚 Browse Secrets ({filteredCount})
                </Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel px={0} py={2}>
              <VStack spacing={2}>
                {/* Search filter */}
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" boxSize={3} />
                  </InputLeftElement>
                  <Input
                    placeholder="Search secrets..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    bg="gray.50"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'blue.400', bg: 'white' }}
                    fontSize="sm"
                  />
                  {filterQuery && (
                    <InputRightElement>
                      <IconButton
                        aria-label="Clear search"
                        icon={<CloseIcon />}
                        size="xs"
                        variant="ghost"
                        onClick={() => setFilterQuery('')}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>

                {/* Secrets list */}
                <VStack spacing={1} w="full" maxH="150px" overflowY="auto">
                  {filteredIndices.map((index) => {
                    const secret = secrets[index];
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        size="xs"
                        w="full"
                        justifyContent="flex-start"
                        onClick={() => handleSecretClick(secret)}
                        leftIcon={
                          <Box
                            w={2}
                            h={2}
                            borderRadius="full"
                            bg={secret.color || 'gray.400'}
                          />
                        }
                        height="auto"
                        py={1}
                      >
                        <VStack spacing={0} align="start" flex={1}>
                          <Text fontSize="xs" isTruncated fontWeight="semibold">
                            {secret.name}
                          </Text>
                          {(secret.website || secret.username) && (
                            <Text fontSize="2xs" color="gray.500" isTruncated>
                              {secret.website && `🌐 ${secret.website}`}
                              {secret.website && secret.username && ' • '}
                              {secret.username && `👤 ${secret.username}`}
                            </Text>
                          )}
                        </VStack>
                      </Button>
                    );
                  })}
                  {filteredCount === 0 && (
                    <Text color="gray.500" fontSize="xs">
                      No secrets match your search
                    </Text>
                  )}
                </VStack>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </Box>
    </VStack>
  );
};

interface CredentialCardProps {
  card: CredentialCard;
}

const CredentialCardComponent: React.FC<CredentialCardProps> = ({ card }) => {
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
