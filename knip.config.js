export default {
  entry: ['index.html', 'src/main.tsx'],
  project: ['src/**/*.{ts,tsx}', 'scripts/**/*.mjs'],
  ignoreDependencies: [
    // React and React DOM are referenced in index.html/main.tsx
    'react',
    'react-dom',
    // Chakra UI and its dependencies - used throughout the app
    '@chakra-ui/react',
    '@chakra-ui/icons',
    '@emotion/react',
    '@emotion/styled',
    'framer-motion',
    // React icons - used in components
    'react-icons',
  ],
};
