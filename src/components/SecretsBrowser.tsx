import React from 'react';
import {
  Box,
  Button,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Text,
  VStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';
import { SecretEntry } from '../crypto';
import { useDebouncedFuzzyFilter } from '../hooks/useDebouncedFuzzyFilter';

interface SecretsBrowserProps {
  secrets: SecretEntry[];
  onSecretClick: (secret: SecretEntry) => void;
}

export const SecretsBrowser: React.FC<SecretsBrowserProps> = ({
  secrets,
  onSecretClick,
}) => {
  const [filterQuery, setFilterQuery] = React.useState('');
  const { filteredIndices, filteredCount } = useDebouncedFuzzyFilter(
    secrets,
    filterQuery,
    'name',
    300, // 300ms debounce delay
  );

  return (
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
                {filteredIndices.map((index: number) => {
                  const secret = secrets[index];
                  return (
                    <Button
                      key={index}
                      variant="outline"
                      size="xs"
                      w="full"
                      justifyContent="flex-start"
                      onClick={() => onSecretClick(secret)}
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
                      <VStack spacing={0} align="start" flex={1}>
                        <Text fontSize="xs" isTruncated fontWeight="semibold">
                          {secret.name}
                        </Text>
                        {(secret.website || secret.username) && (
                          <Text fontSize="2xs" color="gray.500" isTruncated>
                            {secret.website && `🌐 ${secret.website}`}
                            {secret.website && secret.username && ' • '}
                            {secret.username && `👤 ${secret.username}`}
                          </Text>
                        )}
                      </VStack>
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
  );
};
