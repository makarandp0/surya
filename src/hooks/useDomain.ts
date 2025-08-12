import { useState, useEffect } from 'react';
import { fetchActiveTabDomain } from '../utils/browser';

export const useDomain = () => {
  const [domain, setDomain] = useState('');

  // Auto-fetch domain on mount
  useEffect(() => {
    const fetchDomain = async () => {
      const d = await fetchActiveTabDomain();
      if (d) {
        setDomain(d);
      }
    };
    fetchDomain();
  }, []);

  return { domain, setDomain };
};
