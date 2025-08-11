/* eslint-disable no-console */
import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  Badge,
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  Radio,
  RadioGroup,
  Select,
  Slider,
  SliderFilledTrack,
  SliderTrack,
  SliderThumb,
  Stack,
  Switch,
  Text,
  Tooltip,
  useClipboard,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { normalizeDomainFromUrl, derivePassword, generateTOTP } from './crypto';
import { RepeatIcon } from '@chakra-ui/icons';
import pkg from '../package.json';

function isChromeExtensionEnv(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!(chrome as typeof chrome & { tabs?: unknown }).tabs
  );
}

async function fetchActiveTabDomain(): Promise<string> {
  if (!isChromeExtensionEnv()) {
    return '';
  }
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0];
        const url = (tab as chrome.tabs.Tab | undefined)?.url || '';
        resolve(normalizeDomainFromUrl(url));
      });
    } catch {
      resolve('');
    }
  });
}

export default function App() {
  const toast = useToast();
  const [mode, setMode] = useState<'password' | 'totp'>('password');
  const [masterKey, setMasterKey] = useState<string>('');
  const [showMaster, setShowMaster] = useState<boolean>(false);
  const [domain, setDomain] = useState<string>('');
  const [length, setLength] = useState<number>(16);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(false);
  const [generated, setGenerated] = useState<string>('');

  // TOTP specific state
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [showTotpSecret, setShowTotpSecret] = useState<boolean>(false);
  const [totpCode, setTotpCode] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(30);

  // Imported TOTP secrets
  const [importedSecrets, setImportedSecrets] = useState<
    Array<{
      name: string;
      secret: string;
      color?: string;
    }>
  >([]);
  const [selectedSecretIndex, setSelectedSecretIndex] = useState<number>(-1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const { hasCopied, onCopy, setValue } = useClipboard('');

  // Get current secret based on selection
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

  // Get current name for display
  const currentSecretName = useMemo(() => {
    if (
      selectedSecretIndex >= 0 &&
      selectedSecretIndex < importedSecrets.length
    ) {
      return importedSecrets[selectedSecretIndex].name;
    }
    return '';
  }, [selectedSecretIndex, importedSecrets]);

  useEffect(() => {
    // Try to prefill with the active tab's domain
    fetchActiveTabDomain().then((d) => {
      if (d) {
        setDomain(d);
      }
    });
  }, []);

  const canGenerate = useMemo(() => {
    if (mode === 'password') {
      return Boolean(masterKey && domain);
    } else {
      return Boolean(currentTotpSecret);
    }
  }, [mode, masterKey, domain, currentTotpSecret]);

  useEffect(() => {
    if (mode === 'password') {
      setValue(generated);
    } else {
      setValue(totpCode);
    }
  }, [mode, generated, totpCode, setValue]);

  async function handleGenerate() {
    if (!canGenerate) {
      return;
    }
    try {
      if (mode === 'password') {
        const pwd = await derivePassword({
          masterKey,
          domain,
          length,
          includeSymbols,
        });
        setGenerated(pwd);
      } else {
        if (!currentTotpSecret || currentTotpSecret.trim().length === 0) {
          throw new Error(
            'TOTP secret is empty. Please enter a secret or import a valid backup file.',
          );
        }

        // Additional validation for base32 format
        const cleanSecret = currentTotpSecret
          .trim()
          .toUpperCase()
          .replace(/[^A-Z2-7]/g, '');
        if (cleanSecret.length === 0) {
          throw new Error(
            'TOTP secret contains no valid base32 characters (A-Z, 2-7).',
          );
        }

        console.log('Generating TOTP code for secret:', cleanSecret);
        const result = await generateTOTP({ secret: cleanSecret });
        setTotpCode(result.code);
        setTimeRemaining(result.timeRemaining);
      }
    } catch (e) {
      const err = e as Error;
      toast({ status: 'error', title: 'Error', description: err.message });
    }
  }

  // Handle file import
  async function handleFileImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the TOTP app backup format
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
      setSelectedSecretIndex(0); // Select first secret by default

      toast({
        status: 'success',
        title: 'Import Successful',
        description: `Imported ${secrets.length} TOTP secret(s)`,
      });
    } catch (e) {
      const err = e as Error;
      toast({
        status: 'error',
        title: 'Import Failed',
        description: err.message,
      });
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  // Auto-refresh TOTP codes
  useEffect(() => {
    if (mode === 'totp' && totpCode && currentTotpSecret) {
      const interval = setInterval(async () => {
        try {
          const cleanSecret = currentTotpSecret
            .trim()
            .toUpperCase()
            .replace(/[^A-Z2-7]/g, '');
          if (cleanSecret.length > 0) {
            const result = await generateTOTP({ secret: cleanSecret });
            setTotpCode(result.code);
            setTimeRemaining(result.timeRemaining);
          }
        } catch (_e) {
          // Ignore errors during auto-refresh
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [mode, totpCode, currentTotpSecret]);

  async function handleRefreshDomain() {
    const d = await fetchActiveTabDomain();
    if (d) {
      setDomain(d);
    }
  }

  return (
    <Container
      maxW={isChromeExtensionEnv() ? 'none' : 'sm'}
      w={isChromeExtensionEnv() ? '100%' : 'auto'}
      p={4}
      className={isChromeExtensionEnv() ? 'popup-container' : ''}
    >
      <Stack spacing={4}>
        <Heading size="md">ChromePass</Heading>
        <Text color="gray.500">
          Deterministic passwords & TOTP codes. No storage, local crypto.
        </Text>

        <FormControl>
          <FormLabel>Mode</FormLabel>
          <RadioGroup
            value={mode}
            onChange={(value: 'password' | 'totp') => setMode(value)}
          >
            <HStack spacing={4}>
              <Radio value="password">Password</Radio>
              <Radio value="totp">TOTP</Radio>
            </HStack>
          </RadioGroup>
        </FormControl>

        {mode === 'password' ? (
          <>
            <FormControl>
              <FormLabel>Master Key</FormLabel>
              <InputGroup>
                <Input
                  type={showMaster ? 'text' : 'password'}
                  placeholder="Enter master key"
                  value={masterKey}
                  onChange={(e) => setMasterKey(e.target.value)}
                  autoFocus
                />
                <InputRightElement width="4.5rem">
                  <Button size="sm" onClick={() => setShowMaster((s) => !s)}>
                    {showMaster ? 'Hide' : 'Show'}
                  </Button>
                </InputRightElement>
              </InputGroup>
            </FormControl>

            <FormControl>
              <FormLabel>Site Domain</FormLabel>
              <HStack>
                <Input
                  placeholder="example.com"
                  value={domain}
                  onChange={(e) =>
                    setDomain(normalizeDomainFromUrl(e.target.value))
                  }
                />
                <Tooltip label="Use active tab">
                  <IconButton
                    aria-label="Use active tab"
                    icon={<RepeatIcon />}
                    onClick={handleRefreshDomain}
                  />
                </Tooltip>
              </HStack>
            </FormControl>

            <FormControl>
              <FormLabel>Password Length: {length}</FormLabel>
              <Slider
                aria-label="length-slider"
                value={length}
                min={8}
                max={32}
                onChange={(v) => setLength(v)}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </FormControl>

            <HStack justify="space-between">
              <HStack>
                <Switch
                  id="symbols"
                  isChecked={includeSymbols}
                  onChange={(e) => setIncludeSymbols(e.target.checked)}
                />
                <FormLabel htmlFor="symbols" m={0}>
                  Include symbols
                </FormLabel>
              </HStack>
              <Button
                colorScheme="blue"
                onClick={handleGenerate}
                isDisabled={!canGenerate}
              >
                Generate
              </Button>
            </HStack>

            <FormControl>
              <FormLabel>Generated Password</FormLabel>
              <HStack>
                <Input readOnly value={generated} placeholder="—" />
                <Button onClick={onCopy} isDisabled={!generated}>
                  {hasCopied ? 'Copied' : 'Copy'}
                </Button>
              </HStack>
            </FormControl>
          </>
        ) : (
          <>
            <VStack spacing={4}>
              {/* File Import Section */}
              <Box w="full">
                <HStack justify="space-between" align="center" mb={2}>
                  <Text fontSize="sm" fontWeight="medium">
                    Import TOTP Secrets
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="gray"
                    onClick={() => fileInputRef.current?.click()}
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
                <Text fontSize="xs" color="gray.500">
                  Import JSON backup files from TOTP apps
                </Text>
              </Box>

              {/* Secret Selection */}
              {importedSecrets.length > 0 && (
                <FormControl>
                  <FormLabel>Select TOTP Account</FormLabel>
                  <Select
                    value={selectedSecretIndex}
                    onChange={(e) =>
                      setSelectedSecretIndex(parseInt(e.target.value))
                    }
                    placeholder="Choose an account"
                  >
                    {importedSecrets.map((secret, index) => (
                      <option key={index} value={index}>
                        {secret.name}
                      </option>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Manual Secret Input */}
              {importedSecrets.length === 0 && (
                <FormControl>
                  <FormLabel>TOTP Secret</FormLabel>
                  <InputGroup>
                    <Input
                      type={showTotpSecret ? 'text' : 'password'}
                      placeholder="Enter base32 secret key"
                      value={totpSecret}
                      onChange={(e) =>
                        setTotpSecret(
                          e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z2-7]/g, ''),
                        )
                      }
                      autoFocus
                    />
                    <InputRightElement width="4.5rem">
                      <Button
                        size="sm"
                        onClick={() => setShowTotpSecret((s) => !s)}
                      >
                        {showTotpSecret ? 'Hide' : 'Show'}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
                  <Text fontSize="xs" color="gray.500" mt={1}>
                    Base32-encoded secret from your authenticator app
                  </Text>
                </FormControl>
              )}

              <Button
                colorScheme="blue"
                onClick={handleGenerate}
                isDisabled={!canGenerate}
                width="full"
              >
                Generate TOTP Code
              </Button>

              <FormControl>
                <HStack justify="space-between" align="center" mb={2}>
                  <FormLabel m={0}>
                    {currentSecretName ? `${currentSecretName}` : 'TOTP Code'}
                  </FormLabel>
                  {totpCode && (
                    <Badge colorScheme={timeRemaining <= 5 ? 'red' : 'green'}>
                      {timeRemaining}s
                    </Badge>
                  )}
                </HStack>
                <HStack>
                  <Input
                    readOnly
                    value={totpCode}
                    placeholder="—"
                    fontSize="xl"
                    fontFamily="mono"
                    letterSpacing="0.2em"
                  />
                  <Button onClick={onCopy} isDisabled={!totpCode}>
                    {hasCopied ? 'Copied' : 'Copy'}
                  </Button>
                </HStack>
                {totpCode && (
                  <Progress
                    value={(timeRemaining / 30) * 100}
                    size="sm"
                    colorScheme={timeRemaining <= 5 ? 'red' : 'green'}
                    mt={2}
                  />
                )}
              </FormControl>
            </VStack>
          </>
        )}

        <Box fontSize="xs" color="gray.500">
          {mode === 'password'
            ? 'Tip: We never store your master key. Passwords are derived locally using PBKDF2-SHA256 with site-specific salt.'
            : 'Tip: TOTP codes are generated locally using HMAC-SHA1. Your secret never leaves this device.'}
        </Box>
        <Box fontSize="xs" color="gray.500">
          Version: v{pkg.version}
        </Box>
      </Stack>
    </Container>
  );
}
