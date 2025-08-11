import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { App } from './App';

const theme = extendTheme({
  initialColorMode: 'light',
  useSystemColorMode: false,
  styles: {
    global: {
      body: {
        bg: 'transparent',
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
      variants: {
        solid: {
          _hover: {
            transform: 'translateY(-1px)',
            boxShadow: 'md',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
      },
    },
    Input: {
      variants: {
        outline: {
          field: {
            _hover: {
              borderColor: 'gray.300',
            },
            _focus: {
              borderColor: 'blue.400',
              boxShadow: '0 0 0 1px var(--chakra-colors-blue-400)',
            },
          },
        },
      },
    },
    Card: {
      variants: {
        elevated: {
          container: {
            boxShadow: 'sm',
            _hover: {
              boxShadow: 'md',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s ease-in-out',
          },
        },
      },
    },
  },
  colors: {
    blue: {
      50: '#ebf4ff',
      100: '#bee3f8',
      200: '#90cdf4',
      300: '#63b3ed',
      400: '#4299e1',
      500: '#3182ce',
      600: '#2b77cb',
      700: '#2c5aa0',
      800: '#2a4365',
      900: '#1a365d',
    },
  },
});

// Add a class to body if running as Chrome extension
const isChromeExtensionEnv = (): boolean => {
  return (
    typeof chrome !== 'undefined' &&
    !!(chrome as typeof chrome & { tabs?: unknown }).tabs
  );
};

if (isChromeExtensionEnv()) {
  document.body.classList.add('chrome-extension');
} else {
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
