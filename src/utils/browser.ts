export const isChromeExtensionEnv = (): boolean => {
  return (
    typeof chrome !== 'undefined' &&
    !!(chrome as typeof chrome & { tabs?: unknown }).tabs
  );
};

export const fetchActiveTabDomain = async (
): Promise<string> => {
  if (!isChromeExtensionEnv()) {
    return '';
  }
  return new Promise((resolve) => {
    try {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs && tabs[0];
        const url = (tab as chrome.tabs.Tab | undefined)?.url || '';
        // Lazy import to avoid circular deps
        import('../crypto').then(({ normalizeDomainFromUrl }) => {
          resolve(normalizeDomainFromUrl(url));
        }).catch(() => resolve(''));
      });
    } catch {
      resolve('');
    }
  });
};
