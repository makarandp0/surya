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
              onKeyPress={(e) =>
                e.key === 'Enter' && canGenerate && handleGenerate()
              }
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
        </FormControl>
      </Box>

      {/* Password Settings */}
      <Box
        w="full"
        bg="white"
        borderRadius="md"
        borderWidth="1px"
        p={3}
        shadow="sm"
      >
        <VStack spacing={2}>
          <HStack justify="space-between" w="full">
            <FormLabel
              fontSize="xs"
              fontWeight="semibold"
              color="gray.700"
              mb={0}
            >
              🎛️ Length
            </FormLabel>
            <Badge
              colorScheme="blue"
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="full"
            >
              {passwordLength}
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
            <SliderThumb boxSize={2.5} />
          </Slider>

          <HStack justify="space-between" w="full" pt={1}>
            <HStack spacing={2}>
              <Switch
                isChecked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                colorScheme="blue"
                size="sm"
              />
              <FormLabel m={0} fontSize="xs" color="gray.700">
                Symbols
              </FormLabel>
            </HStack>
            <Button
              colorScheme="blue"
              onClick={handleGenerate}
              isDisabled={!canGenerate}
              isLoading={isGenerating}
              loadingText="Gen..."
              size="sm"
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
          borderRadius="md"
          borderWidth="1px"
          p={3}
          shadow="sm"
        >
          <VStack spacing={2}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.800">
              🎯 {credentials.domain}
            </Text>

            {/* Password */}
            <Box w="full">
              <HStack justify="space-between" mb={1}>
                <HStack spacing={1}>
                  <LockIcon color="blue.500" boxSize={3} />
                  <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                    Password
                  </Text>
                </HStack>
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
              </HStack>
              <Input
                readOnly
                value={credentials.password}
                fontFamily="mono"
                fontSize="sm"
                letterSpacing="0.05em"
                bg="gray.50"
                borderColor="gray.200"
                cursor="pointer"
                onClick={passwordClipboard.onCopy}
                title="Click to copy password"
                size="sm"
              />
            </Box>

            {/* TOTP Code */}
            {credentials.totpCode && credentials.secretEntry && (
              <Box w="full">
                <HStack justify="space-between" mb={1}>
                  <HStack spacing={1}>
                    <TimeIcon color="green.500" boxSize={3} />
                    <Text fontSize="xs" fontWeight="semibold" color="gray.700">
                      2FA ({credentials.secretEntry.name})
                    </Text>
                  </HStack>
                  <HStack spacing={2}>
                    <CircularProgress
                      value={(totpTimeRemaining / 30) * 100}
                      color={totpTimeRemaining <= 5 ? 'red.500' : 'green.500'}
                      size="24px"
                      thickness="8px"
                    >
                      <CircularProgressLabel fontSize="2xs">
                        {totpTimeRemaining}
                      </CircularProgressLabel>
                    </CircularProgress>
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
                  </HStack>
                </HStack>
                <Input
                  readOnly
                  value={formatCode(credentials.totpCode)}
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
                  size="sm"
                />
              </Box>
            )}

            {/* No TOTP available */}
            {!credentials.totpCode && (
              <Alert status="info" borderRadius="md" fontSize="xs" py={2}>
                <AlertIcon boxSize={3} />
                No 2FA secret found for this domain.
              </Alert>
            )}
          </VStack>
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
                        <Text fontSize="xs" isTruncated>
                          {secret.name}
                        </Text>
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
