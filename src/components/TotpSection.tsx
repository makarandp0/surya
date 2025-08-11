import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  VStack,
  useToast,
  CircularProgress,
  CircularProgressLabel,
  Badge,
  IconButton,
  Divider,
  Flex,
} from '@chakra-ui/react';
import {
  ViewIcon,
  ViewOffIcon,
  AttachmentIcon,
  CopyIcon,
  SearchIcon,
  CloseIcon,
} from '@chakra-ui/icons';
import { generateTOTP } from '../crypto';
import { useFuzzyFilter } from '../hooks/useFuzzyFilter';
import { TotpCard } from './TotpCard';

export const TotpSection: React.FC = () => {
  const toast = useToast();
  const [totpSecret, setTotpSecret] = useState('');
  const [showTotpSecret, setShowTotpSecret] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);

  const [importedSecrets, setImportedSecrets] = useState<
    Array<{ name: string; secret: string; color?: string }>
  >([]);
  const [selectedSecretIndex, setSelectedSecretIndex] = useState<number>(-1);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filterQuery, setFilterQuery] = useState('');

  // Use custom fuzzy filter hook
  const { filteredIndices, filteredCount, totalCount, hasFilter } =
    useFuzzyFilter(importedSecrets, filterQuery);

  const copyCode = async (code: string, label?: string) => {
    if (!code) {
      return;
    }
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        toast({
          status: 'success',
          title: 'Copied',
          description: label ? `Code for ${label} copied` : undefined,
          isClosable: true,
          duration: 2000,
        });
      }
    } catch {
      toast({ status: 'error', title: 'Copy failed' });
    }
  };

  const formatCode = (code: string) =>
    code ? code.replace(/(\d{3})(?=\d)/g, '$1 ').trim() : '';

  const currentTotpSecret = useMemo(() => {
    if (
      selectedSecretIndex >= 0 &&
      selectedSecretIndex < importedSecrets.length
    ) {
      return importedSecrets[selectedSecretIndex].secret;
    }
    return totpSecret
      .trim()
      .toUpperCase()
      .replace(/[^A-Z2-7]/g, '');
  }, [selectedSecretIndex, importedSecrets, totpSecret]);

  const canGenerate = useMemo(
    () => Boolean(currentTotpSecret),
    [currentTotpSecret],
  );

  const handleGenerate = async () => {
    if (!canGenerate) {
      return;
    }
    try {
      const cleanSecret = currentTotpSecret
        .trim()
        .toUpperCase()
        .replace(/[^A-Z2-7]/g, '');
      if (cleanSecret.length === 0) {
        throw new Error(
          'TOTP secret contains no valid base32 characters (A-Z, 2-7).',
        );
      }
      const result = await generateTOTP({ secret: cleanSecret });
      setTotpCode(result.code);
      setTimeRemaining(result.timeRemaining);
    } catch (e) {
      const err = e as Error;
      toast({ status: 'error', title: 'Error', description: err.message });
    }
  };

  const handleFileImport = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.d || !Array.isArray(data.d)) {
        throw new Error(
          'Invalid file format. Expected TOTP app backup format.',
        );
      }
      const secrets = data.d
        .map((item: { name?: string; secret?: string; color?: string }) => ({
          name: item.name || 'Unknown',
          secret: (item.secret || '')
            .trim()
            .toUpperCase()
            .replace(/[^A-Z2-7]/g, ''),
          color: item.color,
        }))
        .filter(
          (item: { name: string; secret: string; color?: string }) =>
            item.secret && item.secret.length > 0,
        );
      if (secrets.length === 0) {
        throw new Error('No valid secrets found in the file.');
      }
      setImportedSecrets(secrets);
      setSelectedSecretIndex(0);
      toast({
        status: 'success',
        title: 'Import Successful',
        description: `Imported ${secrets.length}`,
        isClosable: true,
      });
    } catch (e) {
      const err = e as Error;
      toast({
        status: 'error',
        title: 'Import Failed',
        description: err.message,
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Auto-generate when the current secret becomes available/changes
  useEffect(() => {
    if (currentTotpSecret) {
      void handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTotpSecret]);

  // For manually entered secret (no imported list), keep refreshing every second
  useEffect(() => {
    if (importedSecrets.length === 0 && totpCode && currentTotpSecret) {
      const interval = setInterval(async () => {
        try {
          const cleanSecret = currentTotpSecret
            .trim()
            .toUpperCase()
            .replace(/[^A-Z2-7]/g, '');
          if (cleanSecret.length > 1) {
            const result = await generateTOTP({ secret: cleanSecret });
            setTotpCode(result.code);
            setTimeRemaining(result.timeRemaining);
          }
        } catch {
          // ignore refresh errors
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [totpCode, currentTotpSecret, importedSecrets.length]);

  // When we have imported secrets, refresh codes for all of them once per second
  useEffect(() => {
    if (importedSecrets.length === 0) {
      setGeneratedCodes([]);
      return;
    }
    let cancelled = false;
    const updateAll = async () => {
      try {
        const now = Math.floor(Date.now() / 1000);
        const results = await Promise.all(
          importedSecrets.map((s) =>
            generateTOTP({ secret: s.secret, timestamp: now }),
          ),
        );
        if (!cancelled) {
          setGeneratedCodes(results.map((r) => r.code));
          setTimeRemaining(results[0]?.timeRemaining ?? 30);
          if (
            selectedSecretIndex >= 0 &&
            selectedSecretIndex < results.length
          ) {
            setTotpCode(results[selectedSecretIndex].code);
          }
        }
      } catch {
        // ignore
      }
    };
    void updateAll();
    const id = setInterval(updateAll, 1000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [importedSecrets, selectedSecretIndex]);

  return (
    <VStack spacing={4}>
      {/* Import Section */}
      <Box
        w="full"
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        p={3}
        shadow="sm"
      >
        <HStack justify="space-between" align="center" w="full">
          <VStack align="start" spacing={0.5}>
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              📱 Import TOTP Secrets
            </Text>
            <Text fontSize="xs" color="gray.500">
              Import JSON backup files from authenticator apps
            </Text>
          </VStack>
          <Button
            size="sm"
            colorScheme="blue"
            leftIcon={<AttachmentIcon />}
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
          >
            Import File
          </Button>
        </HStack>
        <Input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileImport}
          style={{ display: 'none' }}
        />
      </Box>

      {/* Imported TOTP Accounts */}
      {importedSecrets.length > 0 && (
        <Box
          w="full"
          bg="white"
          borderRadius="lg"
          borderWidth="1px"
          p={3}
          shadow="sm"
        >
          <VStack spacing={3}>
            <HStack justify="space-between" w="full">
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                🔢 TOTP Accounts
              </Text>
              <Badge
                colorScheme="blue"
                fontSize="xs"
                px={2}
                py={1}
                borderRadius="full"
              >
                {hasFilter
                  ? `${filteredCount} of ${totalCount} accounts`
                  : `${totalCount} accounts`}
              </Badge>
            </HStack>

            <InputGroup size="sm">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Filter accounts (e.g., 'github', 'goog mail')"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setFilterQuery('');
                  }
                }}
                bg="gray.50"
                borderColor="gray.200"
                _focus={{ borderColor: 'blue.400', bg: 'white' }}
                _hover={{ borderColor: 'gray.300' }}
                aria-label="Filter TOTP accounts"
              />
              {filterQuery && (
                <InputRightElement>
                  <IconButton
                    aria-label="Clear filter"
                    icon={<CloseIcon />}
                    size="xs"
                    variant="ghost"
                    onClick={() => setFilterQuery('')}
                    color="gray.400"
                    _hover={{ color: 'gray.600' }}
                  />
                </InputRightElement>
              )}
            </InputGroup>

            <Box
              borderWidth="1px"
              borderRadius="lg"
              bg="gray.50"
              maxH="280px"
              overflowY="auto"
              w="full"
              p={2}
              className="totp-accounts-list"
            >
              <VStack spacing={2}>
                {filteredIndices.length === 0 && (
                  <VStack spacing={2} py={6}>
                    <Text fontSize="sm" color="gray.500">
                      {hasFilter
                        ? '🔍 No matching accounts'
                        : '📱 No accounts found'}
                    </Text>
                    {hasFilter && (
                      <Button
                        size="sm"
                        variant="ghost"
                        colorScheme="blue"
                        onClick={() => setFilterQuery('')}
                      >
                        Clear filter
                      </Button>
                    )}
                  </VStack>
                )}
                {filteredIndices.map((i: number) => {
                  const s = importedSecrets[i];
                  return (
                    <TotpCard
                      key={i}
                      name={s.name}
                      code={generatedCodes[i] || ''}
                      timeRemaining={timeRemaining}
                      color={s.color}
                      onCopyCode={copyCode}
                    />
                  );
                })}
              </VStack>
            </Box>

            {totalCount > 3 && (
              <Text fontSize="xs" color="gray.500" textAlign="center">
                {hasFilter
                  ? `Showing ${filteredCount} of ${totalCount} accounts`
                  : `Scroll to see all ${totalCount} accounts`}
              </Text>
            )}
          </VStack>
        </Box>
      )}

      {/* Manual TOTP Secret */}
      {importedSecrets.length === 0 && (
        <Box
          w="full"
          bg="white"
          borderRadius="lg"
          borderWidth="1px"
          p={4}
          shadow="sm"
        >
          <VStack spacing={4}>
            <VStack align="start" w="full" spacing={1}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                🔑 Manual TOTP Secret
              </Text>
              <Text fontSize="xs" color="gray.500">
                Enter a Base32-encoded secret from your authenticator app
              </Text>
            </VStack>

            <FormControl>
              <InputGroup>
                <Input
                  type={showTotpSecret ? 'text' : 'password'}
                  placeholder="Enter base32 secret key (A-Z, 2-7)"
                  value={totpSecret}
                  onChange={(e) =>
                    setTotpSecret(
                      e.target.value.toUpperCase().replace(/[^A-Z2-7]/g, ''),
                    )
                  }
                  autoFocus
                  bg="gray.50"
                  borderColor="gray.200"
                  _focus={{ borderColor: 'blue.400', bg: 'white' }}
                  _hover={{ borderColor: 'gray.300' }}
                  fontFamily="mono"
                  letterSpacing="0.1em"
                />
                <InputRightElement width="4.5rem">
                  <IconButton
                    aria-label={showTotpSecret ? 'Hide secret' : 'Show secret'}
                    icon={showTotpSecret ? <ViewOffIcon /> : <ViewIcon />}
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowTotpSecret((s) => !s)}
                  />
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <Divider />

            {/* TOTP Code Display */}
            <VStack spacing={3} w="full">
              <HStack justify="space-between" w="full">
                <VStack align="start" spacing={0}>
                  <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                    🔢 Generated TOTP Code
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {totpCode
                      ? 'Code refreshes automatically'
                      : 'Enter secret above to generate'}
                  </Text>
                </VStack>
                {totpCode && (
                  <Flex align="center">
                    <CircularProgress
                      value={(timeRemaining / 30) * 100}
                      size="40px"
                      color={
                        timeRemaining <= 5
                          ? 'red.400'
                          : timeRemaining <= 10
                          ? 'orange.400'
                          : 'green.400'
                      }
                      trackColor="gray.200"
                    >
                      <CircularProgressLabel fontSize="sm" fontWeight="bold">
                        {timeRemaining}
                      </CircularProgressLabel>
                    </CircularProgress>
                  </Flex>
                )}
              </HStack>

              <HStack w="full" spacing={2}>
                <Input
                  readOnly
                  value={formatCode(totpCode)}
                  placeholder="000 000"
                  fontSize="2xl"
                  fontFamily="mono"
                  fontWeight="bold"
                  letterSpacing="0.2em"
                  textAlign="center"
                  cursor={totpCode ? 'pointer' : 'default'}
                  bg={totpCode ? 'gray.100' : 'gray.50'}
                  borderColor="gray.300"
                  _hover={
                    totpCode ? { bg: 'blue.50', borderColor: 'blue.300' } : {}
                  }
                  _focus={
                    totpCode ? { bg: 'white', borderColor: 'blue.400' } : {}
                  }
                  onClick={() => copyCode(totpCode, 'Manual')}
                  title={totpCode ? 'Click to copy' : ''}
                  h="14"
                />
                <IconButton
                  aria-label="Copy TOTP code"
                  icon={<CopyIcon />}
                  onClick={() => copyCode(totpCode, 'Manual')}
                  colorScheme="blue"
                  variant="outline"
                  size="lg"
                  isDisabled={!totpCode}
                />
              </HStack>
            </VStack>
          </VStack>
        </Box>
      )}
    </VStack>
  );
};
