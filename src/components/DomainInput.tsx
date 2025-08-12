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

export const VaultSearch: React.FC<VaultSearchProps> = ({
  query,
  onQueryChange,
  isGenerating,
  filteredCount = 0,
  totalCount = 0,
}) => {
  const [inputValue, setInputValue] = useState(query);
  const debouncedInputValue = useDebounce(inputValue, 300);

  // Update input value when query prop changes
  useEffect(() => {
    setInputValue(query);
  }, [query]);

  // Call onQueryChange when debounced value changes
  useEffect(() => {
    if (debouncedInputValue !== query) {
      onQueryChange(debouncedInputValue);
    }
  }, [debouncedInputValue, query, onQueryChange]);

  const handleRefreshDomain = async () => {
    const domain = await fetchActiveTabDomain();
    if (domain) {
      setInputValue(domain);
      onQueryChange(domain);
    }
  };

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
            onChange={(e) => setInputValue(e.target.value)}
            bg="gray.50"
            borderColor="gray.200"
            _focus={{ borderColor: 'blue.400', bg: 'white' }}
            size="sm"
          />
          <IconButton
            aria-label="Use active tab domain"
            icon={<RepeatIcon />}
            onClick={handleRefreshDomain}
            colorScheme="blue"
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
