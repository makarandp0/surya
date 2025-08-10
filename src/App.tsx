import React, { useEffect, useMemo, useState } from 'react';
import {
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
import { normalizeDomainFromUrl, derivePassword } from './crypto';
import { RepeatIcon } from '@chakra-ui/icons';

function isChromeExtensionEnv(): boolean {
  return typeof chrome !== 'undefined' && !!(chrome as any).tabs;
}

async function fetchActiveTabDomain(): Promise<string> {
  if (!isChromeExtensionEnv()) return '';
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
  const [masterKey, setMasterKey] = useState<string>('');
  const [showMaster, setShowMaster] = useState<boolean>(false);
  const [domain, setDomain] = useState<string>('');
  const [length, setLength] = useState<number>(16);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(false);
  const [generated, setGenerated] = useState<string>('');
  const { hasCopied, onCopy, setValue } = useClipboard('');

  useEffect(() => {
    // Try to prefill with the active tab's domain
    fetchActiveTabDomain().then((d) => {
      if (d) setDomain(d);
    });
  }, []);

  const canGenerate = useMemo(
    () => Boolean(masterKey && domain),
    [masterKey, domain],
  );

  useEffect(() => {
    setValue(generated);
  }, [generated, setValue]);

  async function handleGenerate() {
    if (!canGenerate) return;
    try {
      const pwd = await derivePassword({
        masterKey,
        domain,
        length,
        includeSymbols,
      });
      setGenerated(pwd);
    } catch (e) {
      const err = e as Error;
      toast({ status: 'error', title: 'Error', description: err.message });
    }
  }

  async function handleRefreshDomain() {
    const d = await fetchActiveTabDomain();
    if (d) setDomain(d);
  }

  return (
    <Container maxW="sm" p={4}>
      <Stack spacing={4}>
        <Heading size="md">ChromePass</Heading>
        <Text color="gray.500">
          Deterministic, no storage. Master key + site.
        </Text>

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

        <Box fontSize="xs" color="gray.500">
          Tip: We never store your master key. Passwords are derived locally
          using PBKDF2-SHA256 with site-specific salt.
        </Box>
      </Stack>
    </Container>
  );
}
