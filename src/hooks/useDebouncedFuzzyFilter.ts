import { useFuzzyFilter } from './useFuzzyFilter';
import { useDebounce } from './useDebounce';

interface FilterableItem {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Debounced version of useFuzzyFilter for better performance
 * @param items - Array of items to filter
 * @param query - Filter query string (will be debounced)
 * @param searchKey - Key to search in (defaults to 'name')
 * @param delay - Debounce delay in milliseconds (defaults to 300)
 * @param minQueryLength - Minimum query length before filtering starts (defaults to 0)
 * @returns Array of filtered items with their original indices
 */
export const useDebouncedFuzzyFilter = <T extends FilterableItem>(
  items: T[],
  query: string,
  searchKey: keyof T = 'name',
  delay = 300,
  minQueryLength = 0,
) => {
  const debouncedQuery = useDebounce(query, delay);

  // If query is shorter than minimum, return all items
  const effectiveQuery =
    debouncedQuery.trim().length >= minQueryLength ? debouncedQuery : '';

  const results = useFuzzyFilter(items, effectiveQuery, searchKey);

  // Indicate if we're waiting for debounce to complete
  const isFiltering =
    query.trim() !== debouncedQuery.trim() && query.trim().length > 0;

  return {
    ...results,
    isFiltering,
    currentQuery: query,
    debouncedQuery,
  };
};
