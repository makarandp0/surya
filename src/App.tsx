/* eslint-disable no-console */
import React, { useState, useEffect } from 'react';
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

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [secrets, setSecrets] = useState<SecretEntry[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [autoLoginAttempted, setAutoLoginAttempted] = useState(false);

  // Navigation state
  const [currentView, setCurrentView] = useState<'main' | 'edit' | 'new'>(
    'main',
  );
  const [editingSecretIndex, setEditingSecretIndex] = useState<number>(-1);

  // Edit form state for footer actions
  const [currentEditData, setCurrentEditData] = useState<SecretEntry | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Footer action handlers for edit mode
  const handleFooterSave = () => {
    if (currentEditData) {
      handleSaveCredential(editingSecretIndex, currentEditData);
    }
  };

  const handleFooterDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmFooterDelete = () => {
    if (editingSecretIndex !== -1) {
      handleDeleteCredential(editingSecretIndex);
    }
    setShowDeleteModal(false);
  };

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
    setEditingSecretIndex(-1); // -1 indicates new entry
    setCurrentView('new');
  };

  const handleEditSecret = (index: number) => {
    setEditingSecretIndex(index);
    setCurrentView('edit');
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setEditingSecretIndex(-1);
  };

  const handleSaveCredential = (index: number, updatedSecret: SecretEntry) => {
    if (index === -1) {
      // Adding new credential
      setSecrets([...secrets, updatedSecret]);
    } else {
      // Update the secrets array with the modified secret
      const newSecrets = [...secrets];
      newSecrets[index] = updatedSecret;
      setSecrets(newSecrets);
    }

    // Go back to main view
    handleBackToMain();
  };

  const handleDeleteCredential = (index: number) => {
    // Remove from secrets array
    const newSecrets = secrets.filter((_, i) => i !== index);
    setSecrets(newSecrets);

    // Go back to main view
    handleBackToMain();
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
      return (
        <EditCredential
          secrets={secrets}
          secretIndex={editingSecretIndex}
          onSave={handleSaveCredential}
          onDelete={handleDeleteCredential}
          onCancel={handleBackToMain}
          isNewEntry={currentView === 'new'}
          onFormDataChange={setCurrentEditData}
        />
      );
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

    return (
      <UnifiedSection
        masterPassword={masterPassword}
        secrets={secrets}
        onLogout={handleLogout}
        onEditSecret={handleEditSecret}
      />
    );
  };

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
      />

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
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
              onClick={() => setShowDeleteModal(false)}
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
