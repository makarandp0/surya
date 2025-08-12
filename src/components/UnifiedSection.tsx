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
  Badge,
  Divider,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
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
  LockIcon,
  TimeIcon,
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

interface WebsiteCredentials {
  domain: string;
  password: string;
  totpCode?: string;
  totpTimeRemaining?: number;
  secretEntry?: SecretEntry;
}

export const UnifiedSection: React.FC<UnifiedSectionProps> = ({
  masterPassword,
  secrets,
  onLogout,
}) => {
  const toast = useToast();

  // Main domain input
  const [domain, setDomain] = useState('');
  const [filterQuery, setFilterQuery] = useState('');

  // Password settings
  const [passwordLength, setPasswordLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(false);

  // Generated credentials
  const [credentials, setCredentials] = useState<WebsiteCredentials | null>(
    null,
  );
  const [isGenerating, setIsGenerating] = useState(false);

  // TOTP timing
  const [totpTimeRemaining, setTotpTimeRemaining] = useState(30);

  // Clipboard
  const passwordClipboard = useClipboard(credentials?.password || '');
  const totpClipboard = useClipboard(credentials?.totpCode || '');

  // Fuzzy filter for secrets
  const { filteredIndices, filteredCount } = useFuzzyFilter(
    secrets,
    filterQuery,
  );

  // Auto-fetch domain on mount
  useEffect(() => {
    fetchActiveTabDomain().then((d) => {
      if (d) {
        setDomain(d);
      }
    });
  }, []);

  // Find matching secret for a domain
  const findSecretForDomain = useCallback(
    (targetDomain: string): SecretEntry | undefined => {
      const normalizedTarget =
        normalizeDomainFromUrl(targetDomain).toLowerCase();

      return secrets.find((secret) => {
        const secretName = secret.name.toLowerCase();
        // Check if domain appears in the secret name
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
        return;
      }

      setIsGenerating(true);
      try {
        const normalizedDomain = normalizeDomainFromUrl(targetDomain);

        // Generate password
        const password = await derivePassword({
          masterKey: masterPassword,
          domain: normalizedDomain,
          length: passwordLength,
          includeSymbols,
        });

        // Find matching TOTP secret
        const secretEntry = findSecretForDomain(normalizedDomain);
        let totpCode: string | undefined;
        let totpTimeRemaining: number | undefined;

        if (secretEntry?.secret) {
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

        setCredentials({
          domain: normalizedDomain,
          password,
          totpCode,
          totpTimeRemaining,
          secretEntry,
        });
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
    [
      masterPassword,
      passwordLength,
      includeSymbols,
      findSecretForDomain,
      toast,
    ],
  );

  // TOTP timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setTotpTimeRemaining(remaining);

      // Regenerate TOTP if it's about to expire and we have credentials
      if (remaining === 30 && credentials?.secretEntry) {
        generateCredentialsForDomain(credentials.domain);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [credentials, generateCredentialsForDomain]);

  // TOTP timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setTotpTimeRemaining(remaining);

      // Regenerate TOTP if it's about to expire and we have credentials
      if (remaining === 30 && credentials?.secretEntry) {
        generateCredentialsForDomain(credentials.domain);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [credentials, generateCredentialsForDomain]);

  const handleGenerate = () => {
    generateCredentialsForDomain(domain);
  };

  const handleRefreshDomain = async () => {
    const d = await fetchActiveTabDomain();
    if (d) {
      setDomain(d);
    }
  };

  const handleSecretClick = (secret: SecretEntry) => {
    // Extract domain from secret name (e.g., "Google:user@domain.com" -> "google.com")
    const parts = secret.name.split(':');
    const domainPart = parts[0].toLowerCase();
    setDomain(domainPart + '.com'); // Simple heuristic
    setFilterQuery('');
  };

  const formatCode = (code: string) =>
    code ? code.replace(/(\d{3})(?=\d)/g, '$1 ').trim() : '';

  const canGenerate = Boolean(domain && masterPassword);

  return (
    <VStack spacing={4} w="full">
      {/* Header with logout */}
      <HStack justify="space-between" w="full">
        <Text fontSize="lg" fontWeight="bold" color="gray.800">
          🔓 Your Vault ({secrets.length} secrets)
        </Text>
        <Button size="sm" variant="outline" onClick={onLogout}>
          Logout
        </Button>
      </HStack>

      <Divider />

      {/* Main Domain Input */}
      <Box
        w="full"
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        p={4}
        shadow="sm"
      >
        <FormControl>
          <FormLabel
            fontSize="sm"
            fontWeight="semibold"
            color="gray.700"
            mb={2}
          >
            🌐 Website Domain
          </FormLabel>
          <HStack>
            <Input
              placeholder="example.com"
              value={domain}
              onChange={(e) =>
                setDomain(normalizeDomainFromUrl(e.target.value))
              }
              bg="gray.50"
              borderColor="gray.200"
              _focus={{ borderColor: 'blue.400', bg: 'white' }}
              onKeyPress={(e) =>
                e.key === 'Enter' && canGenerate && handleGenerate()
              }
            />
            <IconButton
              aria-label="Use active tab"
              icon={<RepeatIcon />}
              onClick={handleRefreshDomain}
              colorScheme="blue"
              variant="outline"
              size="md"
            />
          </HStack>
        </FormControl>
      </Box>

      {/* Password Settings */}
      <Box
        w="full"
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        p={4}
        shadow="sm"
      >
        <VStack spacing={3}>
          <HStack justify="space-between" w="full">
            <FormLabel
              fontSize="sm"
              fontWeight="semibold"
              color="gray.700"
              mb={0}
            >
              🎛️ Password Length
            </FormLabel>
            <Badge
              colorScheme="blue"
              fontSize="xs"
              px={2}
              py={1}
              borderRadius="full"
            >
              {passwordLength} chars
            </Badge>
          </HStack>
          <Slider
            value={passwordLength}
            min={8}
            max={32}
            onChange={(v) => setPasswordLength(v)}
            colorScheme="blue"
            size="sm"
          >
            <SliderTrack bg="gray.200">
              <SliderFilledTrack />
            </SliderTrack>
            <SliderThumb boxSize={3} />
          </Slider>

          <Divider />

          <HStack justify="space-between" w="full">
            <HStack>
              <Switch
                isChecked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                colorScheme="blue"
                size="md"
              />
              <FormLabel m={0} fontSize="sm" color="gray.700">
                Include symbols (!@#$...)
              </FormLabel>
            </HStack>
            <Button
              colorScheme="blue"
              onClick={handleGenerate}
              isDisabled={!canGenerate}
              isLoading={isGenerating}
              loadingText="Generating..."
              size="md"
              fontWeight="semibold"
            >
              🔐 Generate
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Generated Credentials */}
      {credentials && (
        <Box
          w="full"
          bg="white"
          borderRadius="lg"
          borderWidth="1px"
          p={4}
          shadow="sm"
        >
          <VStack spacing={4}>
            <Text fontSize="md" fontWeight="semibold" color="gray.800">
              🎯 Credentials for {credentials.domain}
            </Text>

            {/* Password */}
            <Box w="full">
              <HStack justify="space-between" mb={2}>
                <HStack>
                  <LockIcon color="blue.500" boxSize={4} />
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    Password
                  </Text>
                </HStack>
                <Button
                  size="sm"
                  colorScheme={passwordClipboard.hasCopied ? 'green' : 'blue'}
                  variant="outline"
                  leftIcon={
                    passwordClipboard.hasCopied ? <CheckIcon /> : <CopyIcon />
                  }
                  onClick={passwordClipboard.onCopy}
                >
                  {passwordClipboard.hasCopied ? 'Copied!' : 'Copy'}
                </Button>
              </HStack>
              <Input
                readOnly
                value={credentials.password}
                fontFamily="mono"
                fontSize="md"
                letterSpacing="0.1em"
                bg="gray.50"
                borderColor="gray.200"
                cursor="pointer"
                onClick={passwordClipboard.onCopy}
                title="Click to copy password"
              />
            </Box>

            {/* TOTP Code */}
            {credentials.totpCode && credentials.secretEntry && (
              <>
                <Divider />
                <Box w="full">
                  <HStack justify="space-between" mb={2}>
                    <HStack>
                      <TimeIcon color="green.500" boxSize={4} />
                      <Text
                        fontSize="sm"
                        fontWeight="semibold"
                        color="gray.700"
                      >
                        2FA Code ({credentials.secretEntry.name})
                      </Text>
                    </HStack>
                    <HStack>
                      <CircularProgress
                        value={(totpTimeRemaining / 30) * 100}
                        color={totpTimeRemaining <= 5 ? 'red.500' : 'green.500'}
                        size="32px"
                        thickness="8px"
                      >
                        <CircularProgressLabel fontSize="xs">
                          {totpTimeRemaining}
                        </CircularProgressLabel>
                      </CircularProgress>
                      <Button
                        size="sm"
                        colorScheme={
                          totpClipboard.hasCopied ? 'green' : 'green'
                        }
                        variant="outline"
                        leftIcon={
                          totpClipboard.hasCopied ? <CheckIcon /> : <CopyIcon />
                        }
                        onClick={totpClipboard.onCopy}
                      >
                        {totpClipboard.hasCopied ? 'Copied!' : 'Copy'}
                      </Button>
                    </HStack>
                  </HStack>
                  <Input
                    readOnly
                    value={formatCode(credentials.totpCode)}
                    fontFamily="mono"
                    fontSize="xl"
                    fontWeight="bold"
                    letterSpacing="0.2em"
                    textAlign="center"
                    bg="gray.50"
                    borderColor="gray.200"
                    cursor="pointer"
                    onClick={totpClipboard.onCopy}
                    title="Click to copy 2FA code"
                  />
                </Box>
              </>
            )}

            {/* No TOTP available */}
            {!credentials.totpCode && (
              <>
                <Divider />
                <Alert status="info" borderRadius="md" fontSize="sm">
                  <AlertIcon />
                  No 2FA secret found for this domain in your vault.
                </Alert>
              </>
            )}
          </VStack>
        </Box>
      )}

      <Divider />

      {/* Secrets Browser */}
      <Box
        w="full"
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        p={4}
        shadow="sm"
      >
        <Accordion allowToggle>
          <AccordionItem border="none">
            <AccordionButton px={0} py={2}>
              <Box flex="1" textAlign="left">
                <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                  📚 Browse Your Secrets ({filteredCount})
                </Text>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel px={0} py={4}>
              <VStack spacing={3}>
                {/* Search filter */}
                <InputGroup>
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search secrets..."
                    value={filterQuery}
                    onChange={(e) => setFilterQuery(e.target.value)}
                    bg="gray.50"
                    borderColor="gray.200"
                    _focus={{ borderColor: 'blue.400', bg: 'white' }}
                  />
                  {filterQuery && (
                    <InputRightElement>
                      <IconButton
                        aria-label="Clear search"
                        icon={<CloseIcon />}
                        size="sm"
                        variant="ghost"
                        onClick={() => setFilterQuery('')}
                      />
                    </InputRightElement>
                  )}
                </InputGroup>

                {/* Secrets list */}
                <VStack spacing={2} w="full" maxH="200px" overflowY="auto">
                  {filteredIndices.map((index) => {
                    const secret = secrets[index];
                    return (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        w="full"
                        justifyContent="flex-start"
                        onClick={() => handleSecretClick(secret)}
                        leftIcon={
                          <Box
                            w={3}
                            h={3}
                            borderRadius="full"
                            bg={secret.color || 'gray.400'}
                          />
                        }
                      >
                        <Text fontSize="sm" isTruncated>
                          {secret.name}
                        </Text>
                      </Button>
                    );
                  })}
                  {filteredCount === 0 && (
                    <Text color="gray.500" fontSize="sm">
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
