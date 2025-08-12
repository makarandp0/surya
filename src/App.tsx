/* eslint-disable no-console */
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Stack,
  Text,
  VStack,
  HStack,
  Icon,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { LockIcon } from '@chakra-ui/icons';
import pkg from '../package.json';
import { LoginSection } from './components/LoginSection';
import { UnifiedSection } from './components/UnifiedSection';
import { isChromeExtensionEnv } from './utils/browser';
import { SecretEntry, decryptSecretsFile } from './crypto';
import { storageService } from './services/storage';

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [secrets, setSecrets] = useState<SecretEntry[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Initialize app and check for existing session
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const session = await storageService.loadSession();
        if (session && session.encryptedSecretsFile) {
          // If user has remembered password, try auto-login
          if (session.rememberPassword && session.encryptedMasterPassword) {
            setAutoLoginAttempted(true);
            try {
              const storedPassword = await storageService.decryptStoredPassword(
                session.encryptedMasterPassword,
              );
              const decryptedFile = await decryptSecretsFile(
                session.encryptedSecretsFile,
                storedPassword,
              );

              // Auto-login successful
              setMasterPassword(storedPassword);
              setSecrets(decryptedFile.d);
              setIsLoggedIn(true);

              // Update last accessed
              await storageService.updateLastAccessed();
              setInitError(null);
              return;
            } catch (error) {
              // Auto-login failed, clear corrupted session

              console.warn(
                'Auto-login failed, clearing session:',
                error instanceof Error ? error.message : 'Unknown error',
              );
              await storageService.clearSession();
              setInitError(
                'Your saved session has expired or become corrupted. Please log in again.',
              );
            }
          }
        }
      } catch (error) {
        setInitError(
          error instanceof Error ? error.message : 'Failed to load session',
        );
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  const handleLogin = async (
    password: string,
    secretList: SecretEntry[],
    encryptedData?: string,
    rememberPassword?: boolean,
  ) => {
    setMasterPassword(password);
    setSecrets(secretList);
    setIsLoggedIn(true);

    // Save session data for persistence
    try {
      console.log('handle login: encryptedData', encryptedData);
      await storageService.saveSession({
        encryptedSecretsFile: encryptedData,
        masterPassword: rememberPassword ? password : undefined,
        rememberPassword: rememberPassword,
        expiresAt: Date.now() + SESSION_TIMEOUT,
      });
    } catch (error) {
      console.warn('Failed to save session:', error);
    }
  };

  const handleLogout = async () => {
    setMasterPassword('');
    setSecrets([]);
    setIsLoggedIn(false);

    // Clear stored session
    try {
      await storageService.clearSession();
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  };

  const handleSessionRestore = async (
    password: string,
  ): Promise<SecretEntry[] | null> => {
    try {
      const session = await storageService.loadSession();
      if (!session || !session.encryptedSecretsFile) {
        return null;
      }

      // Try to decrypt the stored secrets with provided password
      const decryptedFile = await decryptSecretsFile(
        session.encryptedSecretsFile,
        password,
      );
      await storageService.updateLastAccessed();

      return decryptedFile.d;
    } catch (error) {
      console.warn('Failed to restore session:', error);
      return null;
    }
  };

  if (isInitializing) {
    return (
      <Container
        maxW={isChromeExtensionEnv() ? 'none' : 'sm'}
        w={isChromeExtensionEnv() ? '100%' : 'auto'}
        p={4}
        className={isChromeExtensionEnv() ? 'popup-container' : ''}
      >
        <VStack spacing={4} justify="center" minH="200px">
          <Spinner size="lg" color="blue.500" />
          <Text fontSize="sm" color="gray.600">
            Loading ChromePass...
          </Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container
      maxW={isChromeExtensionEnv() ? 'none' : 'sm'}
      w={isChromeExtensionEnv() ? '100%' : 'auto'}
      p={3}
      className={isChromeExtensionEnv() ? 'popup-container' : ''}
    >
      <Stack spacing={3} className="scrollable-content">
        {/* Header Section */}
        <Box textAlign="center">
          <HStack justify="center" spacing={2} mb={0.5}>
            <Icon as={LockIcon} color="blue.500" boxSize={4} />
            <Heading size="sm" color="gray.800">
              ChromePass
            </Heading>
          </HStack>
          <Text color="gray.600" fontSize="xs" fontWeight="medium">
            Unified password & TOTP manager
          </Text>
        </Box>

        {/* Error Alert */}
        {initError && (
          <Alert status="error" borderRadius="md" fontSize="xs" py={2}>
            <AlertIcon boxSize={3} />
            {initError}
          </Alert>
        )}

        {/* Main Content */}
        {!isLoggedIn ? (
          <LoginSection
            onLogin={handleLogin}
            onSessionRestore={handleSessionRestore}
            autoLoginFailed={autoLoginAttempted}
          />
        ) : (
          <UnifiedSection
            masterPassword={masterPassword}
            secrets={secrets}
            onLogout={handleLogout}
          />
        )}

        {/* Footer Section */}
        <VStack spacing={1} align="center" mt={2}>
          <Text fontSize="2xs" color="gray.400" fontWeight="medium">
            v{pkg.version}
          </Text>
        </VStack>
      </Stack>
    </Container>
  );
};
