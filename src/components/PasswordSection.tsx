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
  VStack,
  Box,
  Text,
  Badge,
  Divider,
} from '@chakra-ui/react';
import {
  RepeatIcon,
  ViewIcon,
  ViewOffIcon,
  CopyIcon,
  CheckIcon,
} from '@chakra-ui/icons';
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
    <VStack spacing={4}>
      {/* Master Key Section */}
      <Box
        w="full"
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        p={3}
        shadow="sm"
      >
        <FormControl>
          <FormLabel
            fontSize="sm"
            fontWeight="semibold"
            color="gray.700"
            mb={2}
          >
            🔑 Master Key
          </FormLabel>
          <InputGroup>
            <Input
              type={showMaster ? 'text' : 'password'}
              placeholder="Enter your master key"
              value={masterKey}
              onChange={(e) => setMasterKey(e.target.value)}
              autoFocus
              bg="gray.50"
              borderColor="gray.200"
              _focus={{ borderColor: 'blue.400', bg: 'white' }}
              _hover={{ borderColor: 'gray.300' }}
              size="sm"
            />
            <InputRightElement width="4.5rem" height="8">
              <IconButton
                aria-label={showMaster ? 'Hide password' : 'Show password'}
                icon={showMaster ? <ViewOffIcon /> : <ViewIcon />}
                size="sm"
                variant="ghost"
                onClick={() => setShowMaster((s) => !s)}
              />
            </InputRightElement>
          </InputGroup>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Your master key is never stored and remains completely private
          </Text>
        </FormControl>
      </Box>

      {/* Site Domain Section */}
      <Box
        w="full"
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        p={3}
        shadow="sm"
      >
        <FormControl>
          <FormLabel
            fontSize="sm"
            fontWeight="semibold"
            color="gray.700"
            mb={2}
          >
            🌐 Site Domain
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
              _hover={{ borderColor: 'gray.300' }}
              size="sm"
            />
            <Tooltip label="Use active tab domain" hasArrow>
              <IconButton
                aria-label="Use active tab"
                icon={<RepeatIcon />}
                onClick={handleRefreshDomain}
                colorScheme="blue"
                variant="outline"
                size="sm"
              />
            </Tooltip>
          </HStack>
          <Text fontSize="xs" color="gray.500" mt={1}>
            Domain will be normalized (e.g., https://sub.example.com →
            example.com)
          </Text>
        </FormControl>
      </Box>

      {/* Password Configuration */}
      <Box
        w="full"
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        p={3}
        shadow="sm"
      >
        <VStack spacing={3}>
          <FormControl>
            <HStack justify="space-between" mb={2}>
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
                {length} chars
              </Badge>
            </HStack>
            <Slider
              aria-label="Password length slider"
              value={length}
              min={8}
              max={32}
              onChange={(v) => setLength(v)}
              colorScheme="blue"
              size="sm"
            >
              <SliderTrack bg="gray.200">
                <SliderFilledTrack />
              </SliderTrack>
              <SliderThumb boxSize={3} />
            </Slider>
            <HStack
              justify="space-between"
              fontSize="xs"
              color="gray.500"
              mt={0.5}
            >
              <Text>8</Text>
              <Text>32</Text>
            </HStack>
          </FormControl>

          <Divider />

          <HStack justify="space-between" w="full">
            <HStack>
              <Switch
                id="symbols"
                isChecked={includeSymbols}
                onChange={(e) => setIncludeSymbols(e.target.checked)}
                colorScheme="blue"
                size="md"
              />
              <FormLabel htmlFor="symbols" m={0} fontSize="sm" color="gray.700">
                Include symbols (!@#$...)
              </FormLabel>
            </HStack>
            <Button
              colorScheme="blue"
              onClick={handleGenerate}
              isDisabled={!canGenerate}
              size="sm"
              fontWeight="semibold"
              shadow="sm"
              _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
              _active={{ transform: 'translateY(0)' }}
            >
              Generate
            </Button>
          </HStack>
        </VStack>
      </Box>

      {/* Generated Password Output */}
      <Box
        w="full"
        bg="white"
        borderRadius="lg"
        borderWidth="1px"
        p={3}
        shadow="sm"
      >
        <FormControl>
          <FormLabel
            fontSize="sm"
            fontWeight="semibold"
            color="gray.700"
            mb={2}
          >
            🔐 Generated Password
          </FormLabel>
          <HStack>
            <Input
              readOnly
              value={generated}
              placeholder="Password will appear here..."
              fontFamily="mono"
              fontSize="md"
              letterSpacing="0.1em"
              bg="gray.50"
              borderColor="gray.200"
              _focus={{ borderColor: 'blue.400' }}
              cursor={generated ? 'pointer' : 'default'}
              onClick={() => generated && onCopy()}
              title={generated ? 'Click to copy password' : ''}
              size="sm"
            />
            <Button
              onClick={onCopy}
              isDisabled={!generated}
              colorScheme={hasCopied ? 'green' : 'blue'}
              variant="outline"
              size="sm"
              minW="80px"
              leftIcon={hasCopied ? <CheckIcon /> : <CopyIcon />}
            >
              {hasCopied ? 'Copied!' : 'Copy'}
            </Button>
          </HStack>
          {generated && (
            <Text fontSize="xs" color="gray.500" mt={1}>
              Click password field or copy button to copy
            </Text>
          )}
        </FormControl>
      </Box>
    </VStack>
  );
};
