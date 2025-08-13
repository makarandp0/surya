import React from 'react';
import { createRoot } from 'react-dom/client';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { App } from './App';
import { isChromeExtensionEnv } from './utils/browser';

const theme = extendTheme({
  initialColorMode: 'light',
  useSystemColorMode: false,
  styles: {
    global: {
      body: {
        bg: 'white',
        color: 'gray.800',
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        size: 'sm',
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
        outline: {
          _hover: {
            transform: 'translateY(-1px)',
            boxShadow: 'sm',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
      },
    },
    Input: {
      defaultProps: {
        size: 'sm',
        focusBorderColor: 'brand.500',
      },
      variants: {
        outline: {
          field: {
            _hover: {
              borderColor: 'gray.300',
            },
            _focus: {
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
            borderRadius: 'md',
            bg: 'gray.50',
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
    brand: {
      50: '#e9f0fe',
      100: '#c9d8fd',
      200: '#a9c0fb',
      300: '#89a8f9',
      400: '#6a8ff6',
      500: '#4a77f4',
      600: '#2a5ff0',
      700: '#204bd1',
      800: '#1b3ea9',
      900: '#163282',
    },
  },
});

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
