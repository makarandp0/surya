
import React, { useState } from 'react';
import {
  Box,
  Container,
  FormControl,
  FormLabel,
  HStack,
  Heading,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from '@chakra-ui/react';
import pkg from '../package.json';
import { PasswordSection } from './components/PasswordSection';
import { TotpSection } from './components/TotpSection';
import { isChromeExtensionEnv } from './utils/browser';

export const App = () => {
  const [mode, setMode] = useState<'password' | 'totp'>('password');

  return (
    <Container
      maxW={isChromeExtensionEnv() ? 'none' : 'sm'}
      w={isChromeExtensionEnv() ? '100%' : 'auto'}
      p={4}
      className={isChromeExtensionEnv() ? 'popup-container' : ''}
    >
      <Stack spacing={4}>
        <Heading size="md">ChromePass</Heading>
        <Text color="gray.500">
          Deterministic passwords & TOTP codes. No storage, local crypto.
        </Text>

        <FormControl>
          <FormLabel>Mode</FormLabel>
          <RadioGroup value={mode} onChange={(value: 'password' | 'totp') => setMode(value)}>
            <HStack spacing={4}>
              <Radio value="password">Password</Radio>
              <Radio value="totp">TOTP</Radio>
            </HStack>
          </RadioGroup>
        </FormControl>

        {mode === 'password' ? <PasswordSection /> : <TotpSection />}

        <Box fontSize="xs" color="gray.500">
          {mode === 'password'
            ? 'Tip: We never store your master key. Passwords are derived locally using PBKDF2-SHA256 with site-specific salt.'
            : 'Tip: TOTP codes are generated locally using HMAC-SHA1. Your secret never leaves this device.'}
        </Box>
        <Box fontSize="xs" color="gray.500">Version: v{pkg.version}</Box>
      </Stack>
    </Container>
  );
};
