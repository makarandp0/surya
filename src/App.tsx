import React, { useEffect, useMemo, useState } from 'react';
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

  const { hasCopied, onCopy, setValue } = useClipboard('');

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
      return Boolean(totpSecret);
    }
  }, [mode, masterKey, domain, totpSecret]);

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
        const result = await generateTOTP({ secret: totpSecret });
        setTotpCode(result.code);
        setTimeRemaining(result.timeRemaining);
      }
    } catch (e) {
      const err = e as Error;
      toast({ status: 'error', title: 'Error', description: err.message });
    }
  }

  // Auto-refresh TOTP codes
  useEffect(() => {
    if (mode === 'totp' && totpCode) {
      const interval = setInterval(async () => {
        try {
          const result = await generateTOTP({ secret: totpSecret });
          setTotpCode(result.code);
          setTimeRemaining(result.timeRemaining);
        } catch (_e) {
          // Ignore errors during auto-refresh
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [mode, totpCode, totpSecret]);

  async function handleRefreshDomain() {
    const d = await fetchActiveTabDomain();
    if (d) {
      setDomain(d);
    }
  }

  return (
    <Container maxW="sm" p={4}>
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
            <FormControl>
              <FormLabel>TOTP Secret</FormLabel>
              <InputGroup>
                <Input
                  type={showTotpSecret ? 'text' : 'password'}
                  placeholder="Enter base32 secret key"
                  value={totpSecret}
                  onChange={(e) =>
                    setTotpSecret(
                      e.target.value.toUpperCase().replace(/[^A-Z2-7]/g, ''),
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
                <FormLabel m={0}>TOTP Code</FormLabel>
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
