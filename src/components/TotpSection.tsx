import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Badge,
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  InputGroup,
  InputRightElement,
  Progress,
  Select,
  Text,
  VStack,
  useClipboard,
  useToast,
} from '@chakra-ui/react';
import { generateTOTP } from '../crypto';

export const TotpSection: React.FC = () => {
  const toast = useToast();
  const [totpSecret, setTotpSecret] = useState('');
  const [showTotpSecret, setShowTotpSecret] = useState(false);
  const [totpCode, setTotpCode] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(30);

  const [importedSecrets, setImportedSecrets] = useState<
    Array<{ name: string; secret: string; color?: string }>
  >([]);
  const [selectedSecretIndex, setSelectedSecretIndex] = useState<number>(-1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { hasCopied, onCopy } = useClipboard(totpCode);

  const currentTotpSecret = useMemo(() => {
    if (selectedSecretIndex >= 0 && selectedSecretIndex < importedSecrets.length) {
      return importedSecrets[selectedSecretIndex].secret;
    }
    return totpSecret.trim().toUpperCase().replace(/[^A-Z2-7]/g, '');
  }, [selectedSecretIndex, importedSecrets, totpSecret]);

  const currentSecretName = useMemo(() => {
    if (selectedSecretIndex >= 0 && selectedSecretIndex < importedSecrets.length) {
      return importedSecrets[selectedSecretIndex].name;
    }
    return '';
  }, [selectedSecretIndex, importedSecrets]);

  const canGenerate = useMemo(() => Boolean(currentTotpSecret), [currentTotpSecret]);

  const handleGenerate = async () => {
    if (!canGenerate) {return;}
    try {
      const cleanSecret = currentTotpSecret
        .trim()
        .toUpperCase()
        .replace(/[^A-Z2-7]/g, '');
      if (cleanSecret.length === 0) {
        throw new Error('TOTP secret contains no valid base32 characters (A-Z, 2-7).');
      }
      const result = await generateTOTP({ secret: cleanSecret });
      setTotpCode(result.code);
      setTimeRemaining(result.timeRemaining);
    } catch (e) {
      const err = e as Error;
      toast({ status: 'error', title: 'Error', description: err.message });
    }
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {return;}
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.d || !Array.isArray(data.d)) {
        throw new Error('Invalid file format. Expected TOTP app backup format.');
      }
      const secrets = data.d
        .map((item: { name?: string; secret?: string; color?: string }) => ({
          name: item.name || 'Unknown',
          secret: (item.secret || '').trim().toUpperCase().replace(/[^A-Z2-7]/g, ''),
          color: item.color,
        }))
        .filter((item: { name: string; secret: string; color?: string }) => item.secret && item.secret.length > 0);
      if (secrets.length === 0) {
        throw new Error('No valid secrets found in the file.');
      }
      setImportedSecrets(secrets);
      setSelectedSecretIndex(0);
      toast({ status: 'success', title: 'Import Successful', description: `Imported ${secrets.length} TOTP secret(s)` });
    } catch (e) {
      const err = e as Error;
      toast({ status: 'error', title: 'Import Failed', description: err.message });
    }
    if (fileInputRef.current) {fileInputRef.current.value = '';}
  };

  useEffect(() => {
    if (totpCode && currentTotpSecret) {
      const interval = setInterval(async () => {
        try {
          const cleanSecret = currentTotpSecret
            .trim()
            .toUpperCase()
            .replace(/[^A-Z2-7]/g, '');
          if (cleanSecret.length > 0) {
            const result = await generateTOTP({ secret: cleanSecret });
            setTotpCode(result.code);
            setTimeRemaining(result.timeRemaining);
          }
        } catch {
          // ignore refresh errors
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [totpCode, currentTotpSecret]);

  return (
    <VStack spacing={4}>
      <Box w="full">
        <HStack justify="space-between" align="center" mb={2}>
          <Text fontSize="sm" fontWeight="medium">Import TOTP Secrets</Text>
          <Button size="sm" colorScheme="gray" onClick={() => fileInputRef.current?.click()}>
            Import File
          </Button>
        </HStack>
        <Input ref={fileInputRef} type="file" accept=".json" onChange={handleFileImport} style={{ display: 'none' }} />
        <Text fontSize="xs" color="gray.500">Import JSON backup files from TOTP apps</Text>
      </Box>

      {importedSecrets.length > 0 && (
        <FormControl>
          <FormLabel>Select TOTP Account</FormLabel>
          <Select
            value={selectedSecretIndex}
            onChange={(e) => setSelectedSecretIndex(parseInt(e.target.value))}
            placeholder="Choose an account"
          >
            {importedSecrets.map((secret, index) => (
              <option key={index} value={index}>{secret.name}</option>
            ))}
          </Select>
        </FormControl>
      )}

      {importedSecrets.length === 0 && (
        <FormControl>
          <FormLabel>TOTP Secret</FormLabel>
          <InputGroup>
            <Input
              type={showTotpSecret ? 'text' : 'password'}
              placeholder="Enter base32 secret key"
              value={totpSecret}
              onChange={(e) => setTotpSecret(e.target.value.toUpperCase().replace(/[^A-Z2-7]/g, ''))}
              autoFocus
            />
            <InputRightElement width="4.5rem">
              <Button size="sm" onClick={() => setShowTotpSecret((s) => !s)}>
                {showTotpSecret ? 'Hide' : 'Show'}
              </Button>
            </InputRightElement>
          </InputGroup>
          <Text fontSize="xs" color="gray.500" mt={1}>Base32-encoded secret from your authenticator app</Text>
        </FormControl>
      )}

      <Button colorScheme="blue" onClick={handleGenerate} isDisabled={!canGenerate} width="full">
        Generate TOTP Code
      </Button>

      <FormControl>
        <HStack justify="space-between" align="center" mb={2}>
          <FormLabel m={0}>{currentSecretName ? `${currentSecretName}` : 'TOTP Code'}</FormLabel>
          {totpCode && (
            <Badge colorScheme={timeRemaining <= 5 ? 'red' : 'green'}>
              {timeRemaining}s
            </Badge>
          )}
        </HStack>
        <HStack>
          <Input readOnly value={totpCode} placeholder="—" fontSize="xl" fontFamily="mono" letterSpacing="0.2em" />
          <Button onClick={onCopy} isDisabled={!totpCode}>{hasCopied ? 'Copied' : 'Copy'}</Button>
        </HStack>
        {totpCode && (
          <Progress value={(timeRemaining / 30) * 100} size="sm" colorScheme={timeRemaining <= 5 ? 'red' : 'green'} mt={2} />
        )}
      </FormControl>
    </VStack>
  );
};
