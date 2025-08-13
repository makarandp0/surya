import React, { useState, useEffect } from 'react';
import {
  Box,
  FormControl,
  HStack,
  IconButton,
  Input,
  Text,
} from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';
import { fetchActiveTabDomain } from '../utils/browser';
import { useDebounce } from '../hooks/useDebounce';

interface VaultSearchProps {
  query: string;
  onQueryChange: (query: string) => void;
  isGenerating: boolean;
  filteredCount?: number;
  totalCount?: number;
}

// Tracks whether we've already attempted the one-time domain prefill across the app lifecycle.
let hasPrefetchedDomain = false;

export const VaultSearch: React.FC<VaultSearchProps> = ({
  query,
  onQueryChange,
  isGenerating,
  filteredCount = 0,
  totalCount = 0,
}) => {
  const [inputValue, setInputValue] = useState(query);
  const [instanceId] = useState(() => Math.random().toString(36).slice(2, 8));
  const debouncedInputValue = useDebounce(inputValue, 300);

  // Sync local input with query prop
  useEffect(() => {
    setInputValue(query);
  }, [query, instanceId]);

  // Notify parent when debounced input changes.
  // Important: only propagate when debounced value matches the current input
  // to avoid sending a stale value after a programmatic update (e.g., refresh domain).
  useEffect(() => {
    if (debouncedInputValue === inputValue && debouncedInputValue !== query) {
      onQueryChange(debouncedInputValue);
    }
  }, [debouncedInputValue, inputValue, query, onQueryChange, instanceId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setInputValue(next);
  };

  const handleRefreshDomain = async () => {
    try {
      const domain = await fetchActiveTabDomain();
      if (domain) {
        setInputValue(domain);
        onQueryChange(domain);
      }
    } catch (_err) {
      // ignore
    }
  };

  // One-time (global) attempt to prefill with active tab domain on the very first mount only.
  // We intentionally run this effect only once and suppress exhaustive-deps because we
  // want the initial query/onQueryChange values captured at first mount; subsequent mounts
  // (even if the component unmounts/remounts) should NOT trigger another fetch.
  useEffect(() => {
    if (hasPrefetchedDomain) {
      return; // already attempted
    }
    hasPrefetchedDomain = true;
    let cancelled = false;
    (async () => {
      if (query.trim()) {
        return; // user already has a query; do not override
      }
      try {
        const domain = await fetchActiveTabDomain();
        if (cancelled) {
          return;
        }
        if (domain) {
          setInputValue(domain);
          onQueryChange(domain);
        }
      } catch {
        // ignore errors
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // (No logging)

  // Generate status text
  const getStatusText = () => {
    if (isGenerating) {
      return 'Generating...';
    }
    if (inputValue !== query) {
      return 'Searching...';
    }
    if (
      query.trim() &&
      filteredCount !== undefined &&
      totalCount !== undefined
    ) {
      return `Found ${filteredCount} of ${totalCount} entries`;
    }
    return 'Search your vault';
  };

  return (
    <Box
      w="full"
      bg="white"
      borderRadius="md"
      borderWidth="1px"
      p={3}
      shadow="sm"
    >
      <FormControl>
        <HStack spacing={2}>
          <Input
            placeholder="Search domains, usernames, sites..."
            value={inputValue}
            onChange={handleInputChange}
            bg="gray.50"
            borderColor="gray.200"
            _focus={{ borderColor: 'blue.400', bg: 'white' }}
            size="sm"
          />
          <IconButton
            aria-label="Use active tab domain"
            icon={<RepeatIcon />}
            onClick={handleRefreshDomain}
            colorScheme="brand"
            variant="outline"
            size="sm"
          />
        </HStack>
        <Text fontSize="xs" color="gray.600" mt={1} minH="4">
          {getStatusText()}
        </Text>
      </FormControl>
    </Box>
  );
};
