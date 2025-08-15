/* eslint-disable no-console */
import React, { useEffect } from 'react';
import {
  Box,
  Text,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
} from '@chakra-ui/react';
import pkg from '../package.json';
import { LoginSection } from './components/LoginSection';
import { UnifiedSection } from './components/UnifiedSection';
import { EditCredential } from './components/EditCredential';
import { AppLayout, AppHeader, AppFooter } from './components/AppLayout';
import { SecretEntry, decryptSecretsFile } from './crypto';
import { storageService } from './services/storage';
import { useAppContext, useAppActions } from './contexts/useAppContext';
import { CardRenderingDemo } from './components/CardRenderingDemo';

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const App = () => {
  const { state, dispatch } = useAppContext();
  const actions = useAppActions();

  const {
    isLoggedIn,
    isInitializing,
    initError,
    autoLoginAttempted,
    currentView,
    currentEditData,
    showDeleteModal,
    isDirty,
    secrets,
  } = state;

  // Footer action handlers for edit mode
  const handleFooterSave = () => {
    if (currentEditData) {
      actions.saveCurrentEdit();
    }
  };

  const handleFooterDelete = () => {
    actions.setShowDeleteModal(true);
  };

  const confirmFooterDelete = () => {
    actions.deleteCurrentEdit();
  };

  const handleSaveToFile = async () => {
    // TODO: Implement save to encrypted file logic
    // This would encrypt the secrets with the master password and save to storage
    try {
      // For now, just reset the dirty state by updating originalSecrets
      // save the file.
      const fileContents = JSON.stringify({ v: 2, ts: Date.now(), d: secrets });
      const blob = new Blob([fileContents], { type: 'application/text' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `surya-secrets-${
        new Date().toISOString().replace(/:/g, '-').split('.')[0]
      }.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      actions.setSecrets(secrets);
      console.log('Secrets saved to file');
    } catch (error) {
      console.error('Failed to save secrets to file:', error);
      // TODO: Show error toast/notification
    }
  };

  // Initialize app and check for existing session
  useEffect(() => {
    const initializeApp = async () => {
      try {
        const session = await storageService.loadSession();
        if (session && session.encryptedSecretsFile) {
          // If user has remembered password, try auto-login
          if (session.rememberPassword && session.encryptedMasterPassword) {
            dispatch({ type: 'SET_AUTO_LOGIN_ATTEMPTED', payload: true });
            try {
              const storedPassword = await storageService.decryptStoredPassword(
                session.encryptedMasterPassword,
              );
              const decryptedFile = await decryptSecretsFile(
                session.encryptedSecretsFile,
                storedPassword,
              );

              // Auto-login successful
              dispatch({
                type: 'LOGIN',
                payload: { password: storedPassword, secrets: decryptedFile.d },
              });

              // Update last accessed
              await storageService.updateLastAccessed();
              dispatch({ type: 'SET_INIT_ERROR', payload: null });
            } catch (error) {
              // Auto-login failed, clear corrupted session
              console.warn(
                'Auto-login failed, clearing session:',
                error instanceof Error ? error.message : 'Unknown error',
              );
              await storageService.clearSession();
              dispatch({
                type: 'SET_INIT_ERROR',
                payload:
                  'Your saved session has expired or become corrupted. Please log in again.',
              });
            }
          }
        }
      } catch (error) {
        dispatch({
          type: 'SET_INIT_ERROR',
          payload:
            error instanceof Error ? error.message : 'Failed to load session',
        });
      } finally {
        dispatch({ type: 'SET_INITIALIZING', payload: false });
      }
    };

    initializeApp();
  }, [dispatch]);

  const handleLogin = async (
    password: string,
    secretList: SecretEntry[],
    encryptedData?: string,
    rememberPassword?: boolean,
  ) => {
    actions.login(password, secretList);

    // Save session data for persistence
    try {
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
    actions.logout();

    // Clear stored session
    try {
      await storageService.clearSession();
    } catch (error) {
      console.warn('Failed to clear session:', error);
    }
  };

  const handleAddNew = () => {
    actions.startNew();
  };

  const handleBackToMain = () => {
    actions.cancelEdit();
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

  const renderCurrentView = () => {
    if ((currentView === 'edit' || currentView === 'new') && isLoggedIn) {
      return <EditCredential />;
    }

    if (!isLoggedIn) {
      return (
        <LoginSection
          onLogin={handleLogin}
          onSessionRestore={handleSessionRestore}
          autoLoginFailed={autoLoginAttempted}
        />
      );
    }

    return <UnifiedSection />;
  };

  const useCardDemo = false;

  if (useCardDemo) {
    return (
      <AppLayout>
        <AppHeader currentView="main" isLoggedIn={false} />
        {/* Main Content with Scrollable Container */}
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
            <CardRenderingDemo />
          </Box>
        </Box>
        <AppFooter version={pkg.version} />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <AppHeader
        currentView={currentView}
        isLoggedIn={isLoggedIn}
        onLogout={isLoggedIn ? handleLogout : undefined}
        onAddNew={
          isLoggedIn && currentView === 'main' ? handleAddNew : undefined
        }
        onBack={currentView !== 'main' ? handleBackToMain : undefined}
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

          {renderCurrentView()}
        </Box>
      </Box>
      <AppFooter
        version={pkg.version}
        showActions={currentView === 'edit' || currentView === 'new'}
        onSave={currentEditData ? handleFooterSave : undefined}
        onCancel={handleBackToMain}
        onDelete={currentView === 'edit' ? handleFooterDelete : undefined}
        saveLabel={currentView === 'new' ? 'Create Entry' : 'Save Changes'}
        isNewEntry={currentView === 'new'}
        hasUnsavedChanges={isDirty && currentView === 'main'}
        onSaveToFile={handleSaveToFile}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => actions.setShowDeleteModal(false)}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Secret</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this secret? This action cannot be
            undone.
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => actions.setShowDeleteModal(false)}
            >
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmFooterDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AppLayout>
  );
};
