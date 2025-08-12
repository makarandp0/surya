import { useState, useEffect } from 'react';

export const useTotpTimer = (
  hasCredentials: boolean,
  onTimerExpire: () => void,
) => {
  const [totpTimeRemaining, setTotpTimeRemaining] = useState(30);

  // TOTP timer
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const remaining = 30 - (now % 30);
      setTotpTimeRemaining(remaining);

      // Regenerate TOTP if it's about to expire and we have credentials
      if (remaining === 30 && hasCredentials) {
        onTimerExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [hasCredentials, onTimerExpire]);

  return { totpTimeRemaining };
};
