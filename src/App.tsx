/* eslint-disable no-console */
import React, { useState, useEffect } from 'react';
import { Box, Text, VStack, Spinner, Alert, AlertIcon } from '@chakra-ui/react';
import pkg from '../package.json';
import { LoginSection } from './components/LoginSection';
import { UnifiedSection } from './components/UnifiedSection';
import { AppLayout, AppHeader, AppFooter } from './components/AppLayout';
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

  const handleAddNew = () => {
    // TODO: Implement add new credential functionality
    console.log('Add new credential clicked');
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
      <AppLayout>
        <AppHeader />
        {/* Main loading content */}
        <Box
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 0,
            overflowX: 'hidden',
          }}
        >
          <VStack spacing={4} justify="center" minH="200px">
            <Spinner size="lg" color="blue.500" />
            <Text fontSize="sm" color="gray.600">
              Loading Surya...
            </Text>
          </VStack>
        </Box>
        <AppFooter version={pkg.version} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AppHeader
        onLogout={isLoggedIn ? handleLogout : undefined}
        onAddNew={isLoggedIn ? handleAddNew : undefined}
      />
      {/* Main Content */}
      <Box
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
        }}
      >
        <Box
          className="hide-scrollbar"
          style={{
            flex: 1,
            overflowY: 'scroll',
            overflowX: 'hidden',
            padding: '0 12px',
          }}
        >
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
        </Box>
      </Box>
      <AppFooter version={pkg.version} />
    </AppLayout>
  );
};
