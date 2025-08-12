import React, { useState, useRef, useCallback } from 'react';
import { useFuzzyFilter } from './useFuzzyFilter';

interface FilterableItem {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

/**
 * Throttled version of useFuzzyFilter that limits how often filtering occurs
 * Uses throttling instead of debouncing to avoid the flickering issue
 * @param items - Array of items to filter
 * @param query - Filter query string
 * @param searchKey - Key to search in (defaults to 'name')
 * @param throttleMs - Throttle delay in milliseconds (defaults to 100)
 * @returns Array of filtered items with their original indices
 */
export const useThrottledFuzzyFilter = <T extends FilterableItem>(
  items: T[],
  query: string,
  searchKey: keyof T = 'name',
  throttleMs = 100,
) => {
  const [throttledQuery, setThrottledQuery] = useState(query);
  const lastRun = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const updateQuery = useCallback(() => {
    const now = Date.now();

    // If enough time has passed, update immediately
    if (now - lastRun.current >= throttleMs) {
      setThrottledQuery(query);
      lastRun.current = now;
    } else {
      // Otherwise, schedule an update
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const remaining = throttleMs - (now - lastRun.current);
      timeoutRef.current = setTimeout(() => {
        setThrottledQuery(query);
        lastRun.current = Date.now();
      }, remaining);
    }
  }, [query, throttleMs]);

  // Update the throttled query when the input query changes
  React.useEffect(() => {
    updateQuery();

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [updateQuery]);

  return useFuzzyFilter(items, throttledQuery, searchKey);
};
