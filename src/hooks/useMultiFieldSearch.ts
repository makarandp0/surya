import { useMemo } from 'react';
import { SecretEntry, normalizeDomainFromUrl } from '../crypto';

interface SearchableFields {
  name: string;
  website?: string;
  username?: string;
  normalizedWebsite?: string;
}

/**
 * Hook for searching across multiple fields of SecretEntry objects
 * Searches across: name, website, username, and domain variations
 */
export const useMultiFieldSearch = (
  secrets: SecretEntry[],
  query: string,
  minQueryLength = 0,
) => {
  const searchResults = useMemo(() => {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length <= minQueryLength) {
      return {
        filteredSecrets: secrets,
        matchedIndices: secrets.map((_, index) => index),
        filteredCount: secrets.length,
        totalCount: secrets.length,
        query: trimmedQuery,
      };
    }

    const normalizedQuery = trimmedQuery.toLowerCase();
    const queryTokens = normalizedQuery.split(/\s+/).filter(Boolean);

    const matchedResults: {
      secret: SecretEntry;
      index: number;
      score: number;
    }[] = [];

    secrets.forEach((secret, index) => {
      const searchFields: SearchableFields = {
        name: secret.name || '',
        website: secret.website || '',
        username: secret.username || '',
        normalizedWebsite: secret.website
          ? normalizeDomainFromUrl(secret.website)
          : '',
      };

      // Extract domain from name if no explicit website (fallback)
      if (!searchFields.website && searchFields.name.includes(':')) {
        const nameParts = searchFields.name.split(':');
        const domainPart = nameParts[0];
        searchFields.normalizedWebsite = normalizeDomainFromUrl(
          domainPart + '.com',
        );
      }

      let score = 0;
      let matchCount = 0;

      // Check each query token against all searchable fields
      for (const token of queryTokens) {
        let tokenMatched = false;

        // Check exact matches (higher score)
        const fieldsToCheck = [
          { field: searchFields.name.toLowerCase(), weight: 3 },
          { field: searchFields.username?.toLowerCase() || '', weight: 4 },
          { field: searchFields.website?.toLowerCase() || '', weight: 3 },
          {
            field: searchFields.normalizedWebsite?.toLowerCase() || '',
            weight: 2,
          },
        ];

        for (const { field, weight } of fieldsToCheck) {
          if (field.includes(token)) {
            if (field.startsWith(token)) {
              score += weight * 2; // Prefix match bonus
            } else {
              score += weight;
            }
            tokenMatched = true;
          }
        }

        // Fuzzy matching (subsequence) as fallback with lower score
        if (!tokenMatched) {
          for (const { field, weight } of fieldsToCheck) {
            if (isSubsequence(token, field)) {
              score += weight * 0.5; // Lower score for fuzzy match
              tokenMatched = true;
              break; // Only count one fuzzy match per token
            }
          }
        }

        if (tokenMatched) {
          matchCount++;
        }
      }

      // Only include if all tokens matched
      if (matchCount === queryTokens.length && score > 0) {
        matchedResults.push({ secret, index, score });
      }
    });

    // Sort by score (descending) and then by name
    matchedResults.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.secret.name.localeCompare(b.secret.name);
    });

    return {
      filteredSecrets: matchedResults.map((result) => result.secret),
      matchedIndices: matchedResults.map((result) => result.index),
      filteredCount: matchedResults.length,
      totalCount: secrets.length,
      query: trimmedQuery,
    };
  }, [secrets, query, minQueryLength]);

  return searchResults;
};

// Helper function for fuzzy subsequence matching
const isSubsequence = (needle: string, haystack: string): boolean => {
  if (!needle || !haystack) {
    return false;
  }

  let i = 0;
  for (let j = 0; j < haystack.length && i < needle.length; j++) {
    if (needle[i] === haystack[j]) {
      i++;
    }
  }
  return i === needle.length;
};
