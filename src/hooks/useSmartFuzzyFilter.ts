import { useFuzzyFilter } from './useFuzzyFilter';
import { useDebounce } from './useDebounce';

interface FilterableItem {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Smart debounced filtering that uses immediate filtering for short queries
 * and debounced filtering for longer queries
 * @param items - Array of items to filter
 * @param query - Filter query string
 * @param searchKey - Key to search in (defaults to 'name')
 * @param immediateThreshold - Query length threshold for immediate filtering (defaults to 3)
 * @param debounceDelay - Debounce delay for longer queries (defaults to 50)
 * @returns Array of filtered items with their original indices
 */
export const useSmartFuzzyFilter = <T extends FilterableItem>(
  items: T[],
  query: string,
  searchKey: keyof T = 'name',
  immediateThreshold = 3,
  debounceDelay = 50,
) => {
  const debouncedQuery = useDebounce(query, debounceDelay);

  // Use immediate filtering for short queries, debounced for longer ones
  const effectiveQuery =
    query.trim().length <= immediateThreshold ? query : debouncedQuery;

  const results = useFuzzyFilter(items, effectiveQuery, searchKey);

  // Only show filtering indicator for longer queries that are being debounced
  const isFiltering =
    query.trim().length > immediateThreshold &&
    query.trim() !== debouncedQuery.trim() &&
    query.trim().length > 0;

  return {
    ...results,
    isFiltering,
    currentQuery: query,
    effectiveQuery,
  };
};
