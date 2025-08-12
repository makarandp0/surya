import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  Checkbox,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon, AttachmentIcon } from '@chakra-ui/icons';
import { decryptSecretsFile, SecretEntry } from '../crypto';
import { storageService } from '../services/storage';

interface LoginSectionProps {
  onLogin: (
    masterPassword: string,
    secrets: SecretEntry[],
    encryptedData?: string,
    rememberPassword?: boolean,
  ) => void;
  onSessionRestore?: (password: string) => Promise<SecretEntry[] | null>;
  autoLoginFailed?: boolean; // Indicates if auto-login was attempted but failed
}

export const LoginSection: React.FC<LoginSectionProps> = ({
  onLogin,
  onSessionRestore,
  autoLoginFailed = false,
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [masterPassword, setMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [hasStoredSession, setHasStoredSession] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkStoredSession = async () => {
      try {
        const session = await storageService.loadSession();
        // Only show stored session UI if:
        // 1. Session exists AND
        // 2. Either auto-login failed OR password was not remembered (needs manual entry)
        if (session && session.encryptedSecretsFile) {
          const shouldShowQuickLogin =
            autoLoginFailed ||
            !session.rememberPassword ||
            !session.encryptedMasterPassword;
          setHasStoredSession(shouldShowQuickLogin);
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to check stored session:', error);
      }
    };

    checkStoredSession();
  }, [autoLoginFailed]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleQuickLogin = async () => {
    if (!masterPassword) {
      toast({
        status: 'error',
        title: 'Error',
        description: 'Please enter your master password',
      });
      return;
    }

    if (!onSessionRestore) {
      return;
    }

    setIsLoading(true);

    try {
      const secrets = await onSessionRestore(masterPassword);

      if (secrets) {
        onLogin(masterPassword, secrets, undefined, true);
        toast({
          status: 'success',
          title: 'Welcome Back!',
          description: `Restored session with ${secrets.length} secret(s)`,
        });
      } else {
        toast({
          status: 'error',
          title: 'Login Failed',
          description: 'Invalid password or session expired',
        });
      }
    } catch (error) {
      toast({
        status: 'error',
        title: 'Quick Login Failed',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!masterPassword) {
      toast({
        status: 'error',
        title: 'Error',
        description: 'Please enter your master password',
      });
      return;
    }

    if (!selectedFile) {
      toast({
        status: 'error',
        title: 'Error',
        description: 'Please select your secrets file',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Read the file
      const fileContent = await selectedFile.text();

      let secrets: SecretEntry[] = [];

      // Try to parse as encrypted file first
      const decryptedFile = await decryptSecretsFile(
        fileContent,
        masterPassword,
      );
      secrets = decryptedFile.d;

      if (secrets.length === 0) {
        toast({
          status: 'warning',
          title: 'No Secrets Found',
          description: 'The secrets file appears to be empty',
        });
      }

      onLogin(masterPassword, secrets, fileContent, rememberPassword);
    } catch (error) {
      toast({
        status: 'error',
        title: 'Login Failed',
        description:
          error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canLogin = Boolean(
    masterPassword && (selectedFile || hasStoredSession),
  );
  const canQuickLogin = Boolean(masterPassword && hasStoredSession);

  return (
    <VStack spacing={3}>
      {/* Instructions */}
      <Box textAlign="center">
        <Text fontSize="xs" color="gray.600">
          {hasStoredSession
            ? 'Enter password to restore session'
            : 'Enter password and select encrypted secrets file'}
        </Text>
      </Box>

      {/* Quick Login for stored session */}
      {hasStoredSession && (
        <Box
          w="full"
          bg="green.50"
          borderRadius="md"
          borderWidth="1px"
          borderColor="green.200"
          p={3}
          shadow="sm"
        >
          <FormControl>
            <InputGroup size="sm">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="🔑 Enter your master password (session will be restored)"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                autoFocus
                bg="white"
                borderColor="green.200"
                _focus={{ borderColor: 'green.400', bg: 'white' }}
                _hover={{ borderColor: 'green.300' }}
                onKeyPress={(e) =>
                  e.key === 'Enter' && canQuickLogin && handleQuickLogin()
                }
                fontSize="sm"
              />
              <InputRightElement width="4rem">
                <IconButton
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                  size="xs"
                  variant="ghost"
                  onClick={() => setShowPassword(!showPassword)}
                />
              </InputRightElement>
            </InputGroup>
          </FormControl>

          <Button
            colorScheme="green"
            size="sm"
            w="full"
            mt={2}
            onClick={handleQuickLogin}
            isDisabled={!canQuickLogin}
            isLoading={isLoading}
            loadingText="Restoring..."
          >
            🚀 Restore Session
          </Button>
        </Box>
      )}

      {/* File selection for new login */}
      {!hasStoredSession && (
        <>
          {/* Master Password Section */}
          <Box
            w="full"
            bg="white"
            borderRadius="md"
            borderWidth="1px"
            p={3}
            shadow="sm"
          >
            <FormControl>
              <InputGroup size="sm">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="🔑 Enter your master password"
                  value={masterPassword}
                  onChange={(e) => setMasterPassword(e.target.value)}
                  autoFocus={!hasStoredSession}
                  bg="gray.50"
                  borderColor="gray.200"
                  _focus={{ borderColor: 'blue.400', bg: 'white' }}
                  _hover={{ borderColor: 'gray.300' }}
                  onKeyPress={(e) =>
                    e.key === 'Enter' && canLogin && handleLogin()
                  }
                  fontSize="sm"
                />
                <InputRightElement width="4rem">
                  <IconButton
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                    size="xs"
                    variant="ghost"
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </InputRightElement>
              </InputGroup>
              <Checkbox
                isChecked={rememberPassword}
                onChange={(e) => setRememberPassword(e.target.checked)}
                colorScheme="blue"
                size="sm"
                mt={2}
              >
                <Text fontSize="xs" color="blue.700">
                  Remember password for auto-login
                </Text>
              </Checkbox>
            </FormControl>
          </Box>

          {/* File Selection Section */}
          <Box
            w="full"
            bg="white"
            borderRadius="md"
            borderWidth="1px"
            p={3}
            shadow="sm"
          >
            <FormControl>
              <HStack spacing={2}>
                <Input
                  value={selectedFile ? selectedFile.name : ''}
                  placeholder="📁 Click to select your encrypted secrets file"
                  readOnly
                  bg="gray.50"
                  borderColor="gray.200"
                  _focus={{ borderColor: 'blue.400' }}
                  cursor="pointer"
                  onClick={() => fileInputRef.current?.click()}
                  fontSize="sm"
                  size="sm"
                />
                <IconButton
                  aria-label="Select file"
                  icon={<AttachmentIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                />
              </HStack>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </FormControl>
          </Box>

          {/* Login Button */}
          <Button
            colorScheme="blue"
            size="sm"
            w="full"
            onClick={handleLogin}
            isDisabled={!canLogin}
            isLoading={isLoading}
            loadingText="Decrypting..."
            fontWeight="semibold"
            shadow="sm"
            _hover={{ transform: 'translateY(-1px)', shadow: 'md' }}
            _active={{ transform: 'translateY(0)' }}
          >
            🚀 Unlock Vault
          </Button>
        </>
      )}

      {/* Clear stored session option */}
      {hasStoredSession && (
        <Button
          variant="outline"
          size="sm"
          colorScheme="gray"
          onClick={async () => {
            await storageService.clearSession();
            setHasStoredSession(false);
          }}
        >
          Use Different File
        </Button>
      )}

      {/* Security Note */}
      <Alert status="info" borderRadius="md" fontSize="sm">
        <AlertIcon />
        Your master password and secrets are processed locally and never leave
        your device.
      </Alert>
    </VStack>
  );
};
