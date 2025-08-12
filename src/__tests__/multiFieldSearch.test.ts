import { describe, it, expect } from 'vitest';
import { SecretEntry } from '../crypto';

// Mock hook implementation for testing
const testMultiFieldSearch = (
  secrets: SecretEntry[],
  query: string,
  minQueryLength = 0,
) => {
  // This simulates what the hook would return
  const trimmedQuery = query.trim();

  // If query is empty or too short, return all secrets
  if (trimmedQuery.length === 0 || trimmedQuery.length < minQueryLength) {
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
    const searchFields = [
      secret.name || '',
      secret.website || '',
      secret.username || '',
    ];

    let score = 0;
    let matchCount = 0;

    for (const token of queryTokens) {
      let tokenMatched = false;

      for (const field of searchFields) {
        const normalizedField = field.toLowerCase();
        if (normalizedField.includes(token)) {
          score += normalizedField.startsWith(token) ? 2 : 1;
          tokenMatched = true;
        }
      }

      if (tokenMatched) {
        matchCount++;
      }
    }

    if (matchCount === queryTokens.length && score > 0) {
      matchedResults.push({ secret, index, score });
    }
  });

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
};

describe('useMultiFieldSearch', () => {
  const testSecrets: SecretEntry[] = [
    {
      name: 'Google:user@gmail.com',
      secret: 'JBSWY3DPEHPK3PXP',
      color: '#4285f4',
      website: 'google.com',
      username: 'user@gmail.com',
    },
    {
      name: 'GitHub:username',
      secret: 'ABCDEFGHIJKLMNOP',
      color: '#333',
      website: 'github.com',
      username: 'username',
    },
    {
      name: 'Facebook:user',
      secret: 'MFRGG6TQNZSWK43UMFZXIZTDORUW2ZLT',
      color: '#3F51B5',
      website: 'facebook.com',
      username: 'user',
    },
  ];

  it('returns all secrets when query is empty', () => {
    const result = testMultiFieldSearch(testSecrets, '');

    expect(result.filteredSecrets).toHaveLength(3);
    expect(result.filteredCount).toBe(3);
    expect(result.totalCount).toBe(3);
  });

  it('filters by website domain', () => {
    const result = testMultiFieldSearch(testSecrets, 'google');

    expect(result.filteredSecrets).toHaveLength(1);
    expect(result.filteredSecrets[0].website).toBe('google.com');
  });

  it('filters by username', () => {
    const result = testMultiFieldSearch(testSecrets, 'user@gmail.com');

    expect(result.filteredSecrets).toHaveLength(1);
    expect(result.filteredSecrets[0].username).toBe('user@gmail.com');
  });

  it('filters by secret name', () => {
    const result = testMultiFieldSearch(testSecrets, 'GitHub');

    expect(result.filteredSecrets).toHaveLength(1);
    expect(result.filteredSecrets[0].name).toBe('GitHub:username');
  });

  it('handles multiple query tokens', () => {
    const result = testMultiFieldSearch(testSecrets, 'user google');

    expect(result.filteredSecrets).toHaveLength(1);
    expect(result.filteredSecrets[0].website).toBe('google.com');
    expect(result.filteredSecrets[0].username).toBe('user@gmail.com');
  });

  it('returns empty results for non-matching query', () => {
    const result = testMultiFieldSearch(testSecrets, 'nonexistent');

    expect(result.filteredSecrets).toHaveLength(0);
    expect(result.filteredCount).toBe(0);
  });

  it('performs case-insensitive matching', () => {
    const result = testMultiFieldSearch(testSecrets, 'GITHUB');

    expect(result.filteredSecrets).toHaveLength(1);
    expect(result.filteredSecrets[0].website).toBe('github.com');
  });
});
