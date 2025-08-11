import { useMemo, useCallback } from 'react';

interface FilterableItem {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Custom hook for fuzzy filtering with subsequence matching
 * @param items - Array of items to filter
 * @param query - Filter query string
 * @param searchKey - Key to search in (defaults to 'name')
 * @returns Array of filtered items with their original indices
 */
export const useFuzzyFilter = <T extends FilterableItem>(
  items: T[],
  query: string,
  searchKey: keyof T = 'name',
) => {
  const normalize = useCallback(
    (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ''),
    [],
  );

  const isSubsequence = useCallback((needle: string, haystack: string) => {
    if (!needle) {
      return true;
    }
    let i = 0;
    for (let j = 0; j < haystack.length && i < needle.length; j++) {
      if (needle[i] === haystack[j]) {
        i++;
      }
    }
    return i === needle.length;
  }, []);

  const fuzzyMatch = useCallback(
    (query: string, text: string) => {
      const q = query.trim();
      if (!q) {
        return true; // no filter -> match all
      }
      const hay = normalize(text);
      // Require that every token in the query appears as a subsequence
      return q
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .every((tok) => isSubsequence(normalize(tok), hay));
    },
    [normalize, isSubsequence],
  );

  const filteredResults = useMemo(() => {
    if (!query.trim()) {
      return items.map((item, index) => ({ item, originalIndex: index }));
    }

    return items
      .map((item, index) => ({ item, originalIndex: index }))
      .filter(({ item }) => fuzzyMatch(query, String(item[searchKey])));
  }, [items, query, searchKey, fuzzyMatch]);

  return {
    filteredItems: filteredResults.map((r) => r.item),
    filteredIndices: filteredResults.map((r) => r.originalIndex),
    totalCount: items.length,
    filteredCount: filteredResults.length,
    hasFilter: query.trim().length > 0,
  };
};
