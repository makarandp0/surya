import { useState } from 'react';
import { useDebounce } from './useDebounce';
import { useMultiFieldSearch } from './useMultiFieldSearch';
import { SecretEntry } from '../crypto';

export const useVaultSearch = (secrets: SecretEntry[]) => {
  const [query, setQuery] = useState('');

  // Debounce the query to avoid too frequent searches
  const debouncedQuery = useDebounce(query, 500);

  // Search across multiple fields
  const { filteredSecrets, matchedIndices, filteredCount } =
    useMultiFieldSearch(
      secrets,
      debouncedQuery,
      0, // Allow searching from first character
    );

  return {
    query,
    setQuery,
    filteredSecrets,
    matchedIndices,
    isGenerating: query !== debouncedQuery && query.trim() !== '',
    filteredCount,
    totalCount: secrets.length,
  };
};
