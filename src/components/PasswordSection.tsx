import React, { useEffect, useState } from 'react';
import {
  Button,
  FormControl,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Slider,
  SliderFilledTrack,
  SliderThumb,
  SliderTrack,
  Switch,
  Tooltip,
  useClipboard,
  useToast,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { derivePassword, normalizeDomainFromUrl } from '../crypto';
import { fetchActiveTabDomain } from '../utils/browser';

export const PasswordSection: React.FC = () => {
  const toast = useToast();
  const [masterKey, setMasterKey] = useState('');
  const [showMaster, setShowMaster] = useState(false);
  const [domain, setDomain] = useState('');
  const [length, setLength] = useState(16);
  const [includeSymbols, setIncludeSymbols] = useState(false);
  const [generated, setGenerated] = useState('');
  const { hasCopied, onCopy } = useClipboard(generated);

  useEffect(() => {
    fetchActiveTabDomain().then((d) => {
      if (d) {
        setDomain(d);
      }
    });
  }, []);

  const canGenerate = Boolean(masterKey && domain);

  const handleGenerate = async () => {
    if (!canGenerate) {
      return;
    }
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
  };

  const handleRefreshDomain = async () => {
    const d = await fetchActiveTabDomain();
    if (d) {
      setDomain(d);
    }
  };

  return (
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
            onChange={(e) => setDomain(normalizeDomainFromUrl(e.target.value))}
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
  );
};
