import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import App from './App';

const theme = extendTheme({
  initialColorMode: 'system',
  useSystemColorMode: true,
});

// Add a class to body if running as Chrome extension
function isChromeExtensionEnv(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    !!(chrome as typeof chrome & { tabs?: unknown }).tabs
  );
}

if (isChromeExtensionEnv()) {
  document.body.classList.add('chrome-extension');
}

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <ChakraProvider theme={theme}>
      <App />
    </ChakraProvider>
  </React.StrictMode>,
);
