import React, { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Stack,
  Text,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  VStack,
  HStack,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { LockIcon, TimeIcon } from '@chakra-ui/icons';
import pkg from '../package.json';
import { PasswordSection } from './components/PasswordSection';
import { TotpSection } from './components/TotpSection';
import { isChromeExtensionEnv } from './utils/browser';

export const App = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const mode = useMemo<'password' | 'totp'>(
    () => (tabIndex === 0 ? 'password' : 'totp'),
    [tabIndex],
  );

  return (
    <Container
      maxW={isChromeExtensionEnv() ? 'none' : 'sm'}
      w={isChromeExtensionEnv() ? '100%' : 'auto'}
      p={4}
      className={isChromeExtensionEnv() ? 'popup-container' : ''}
    >
      <Stack spacing={4} className="scrollable-content">
        {/* Header Section */}
        <Box textAlign="center">
          <HStack justify="center" spacing={2} mb={1}>
            <Icon as={LockIcon} color="blue.500" boxSize={5} />
            <Heading size="md" color="gray.800">
              ChromePass
            </Heading>
          </HStack>
          <Text color="gray.600" fontSize="xs" fontWeight="medium">
            Deterministic passwords & TOTP codes • No storage, local crypto
          </Text>
        </Box>

        <Divider />

        {/* Main Tabs */}
        <Tabs
          index={tabIndex}
          onChange={setTabIndex}
          isFitted
          variant="soft-rounded"
          colorScheme="blue"
        >
          <TabList bg="gray.100" borderRadius="lg" p={1} mb={3}>
            <Tab
              borderRadius="md"
              fontWeight="semibold"
              fontSize="sm"
              py={2}
              _selected={{
                bg: 'white',
                color: 'blue.600',
                shadow: 'sm',
              }}
            >
              <Icon as={LockIcon} mr={2} boxSize={3} />
              Password
            </Tab>
            <Tab
              borderRadius="md"
              fontWeight="semibold"
              fontSize="sm"
              py={2}
              _selected={{
                bg: 'white',
                color: 'blue.600',
                shadow: 'sm',
              }}
            >
              <Icon as={TimeIcon} mr={2} boxSize={3} />
              TOTP
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel px={0} py={0}>
              <PasswordSection />
            </TabPanel>
            <TabPanel px={0} py={0}>
              <TotpSection />
            </TabPanel>
          </TabPanels>
        </Tabs>

        <Divider />

        {/* Footer Section */}
        <VStack spacing={1} align="center">
          <Box
            fontSize="xs"
            color="gray.600"
            textAlign="center"
            bg="gray.50"
            p={2}
            borderRadius="md"
            borderLeft="3px solid"
            borderColor={mode === 'password' ? 'blue.400' : 'green.400'}
          >
            <Text fontWeight="medium" mb={0.5}>
              {mode === 'password' ? '🔐 Security Tip' : '⏰ Privacy Tip'}
            </Text>
            <Text fontSize="xs" lineHeight="short">
              {mode === 'password'
                ? 'Master key never stored. Passwords derived locally using PBKDF2-SHA256.'
                : 'TOTP codes generated locally using HMAC-SHA1. Secrets never leave device.'}
            </Text>
          </Box>

          <Text fontSize="xs" color="gray.400" fontWeight="medium">
            v{pkg.version}
          </Text>
        </VStack>
      </Stack>
    </Container>
  );
};
