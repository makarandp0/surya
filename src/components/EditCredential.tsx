import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { SecretEntry } from '../crypto';
import { COLORS } from '../constants/colors';
import { useAppContext, useAppActions } from '../contexts/useAppContext';

export const EditCredential: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const actions = useAppActions();

  const { secrets, editingSecretIndex, currentView } = state;
  const isNewEntry = currentView === 'new';
  const secret = isNewEntry ? null : secrets[editingSecretIndex];

  const [formData, setFormData] = useState({
    name: secret?.name || '',
    website: secret?.website || '',
    username: secret?.username || '',
    secret: secret?.secret || '',
    passwordLength: secret?.passwordLength || 16,
    includeSymbols: secret?.includeSymbols || false,
  });

  // Pass current form data to context for footer actions
  useEffect(() => {
    const currentFormAsSecret: SecretEntry = {
      ...(secret || {}),
      name: formData.name,
      website: formData.website,
      username: formData.username,
      secret: formData.secret,
      passwordLength: formData.passwordLength,
      includeSymbols: formData.includeSymbols,
      salt: secret?.salt || '',
    };
    dispatch({ type: 'SET_CURRENT_EDIT_DATA', payload: currentFormAsSecret });
  }, [formData, secret, dispatch]);

  if (!isNewEntry && (editingSecretIndex === -1 || !secret)) {
    return (
      <Box p={4}>
        <Text color="red.500">Secret not found</Text>
        <Button onClick={actions.cancelEdit} mt={4}>
          Go Back
        </Button>
      </Box>
    );
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Card
      mt={4}
      w="full"
      maxW="md"
      shadow="sm"
      borderRadius="lg"
      border={`1px solid ${COLORS.border}`}
    >
      <CardBody pt={4} pb={4}>
        <VStack spacing={4}>
          {/* Name Field */}
          <FormControl>
            <FormLabel>Display Name</FormLabel>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Google Account, Work Email"
              fontSize="md"
              h={10}
              borderRadius="md"
              borderColor={COLORS.border}
              _hover={{ borderColor: COLORS.secondary }}
              _focus={{
                borderColor: COLORS.link,
                boxShadow: `0 0 0 1px ${COLORS.link}`,
              }}
              _placeholder={{
                color: COLORS.secondary,
                fontSize: 'sm',
              }}
            />
          </FormControl>

          {/* Website Field */}
          <FormControl>
            <FormLabel>Website URL</FormLabel>
            <Input
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="e.g., https://google.com, company.com"
              fontSize="md"
              h={10}
              borderRadius="md"
              borderColor={COLORS.border}
              _hover={{ borderColor: COLORS.secondary }}
              _focus={{
                borderColor: COLORS.link,
                boxShadow: `0 0 0 1px ${COLORS.link}`,
              }}
              _placeholder={{
                color: COLORS.secondary,
                fontSize: 'sm',
              }}
            />
          </FormControl>

          {/* Username Field */}
          <FormControl>
            <FormLabel>Username / Email</FormLabel>
            <Input
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="e.g., john.doe@example.com"
              fontSize="md"
              h={10}
              borderRadius="md"
              borderColor={COLORS.border}
              _hover={{ borderColor: COLORS.secondary }}
              _focus={{
                borderColor: COLORS.link,
                boxShadow: `0 0 0 1px ${COLORS.link}`,
              }}
              _placeholder={{
                color: COLORS.secondary,
                fontSize: 'sm',
              }}
            />
          </FormControl>

          {/* TOTP Secret Field */}
          <FormControl>
            <FormLabel>
              TOTP Secret{' '}
              <Text
                as="span"
                color={COLORS.secondary}
                fontWeight="normal"
                ml={1}
              >
                (Optional)
              </Text>
            </FormLabel>
            <Input
              value={formData.secret}
              onChange={(e) => handleInputChange('secret', e.target.value)}
              placeholder="For 2FA authentication codes"
              fontSize="md"
              h={10}
              borderRadius="md"
              borderColor={COLORS.border}
              _hover={{ borderColor: COLORS.secondary }}
              _focus={{
                borderColor: COLORS.link,
                boxShadow: `0 0 0 1px ${COLORS.link}`,
              }}
              _placeholder={{
                color: COLORS.secondary,
                fontSize: 'sm',
              }}
            />
          </FormControl>

          {/* Password Length Field */}
          <FormControl>
            <FormLabel>Generated Password Length</FormLabel>
            <Input
              type="number"
              value={formData.passwordLength}
              onChange={(e) =>
                handleInputChange(
                  'passwordLength',
                  parseInt(e.target.value) || 16,
                )
              }
              placeholder="16"
              fontSize="md"
              h={10}
              borderRadius="md"
              borderColor={COLORS.border}
              _hover={{ borderColor: COLORS.secondary }}
              _focus={{
                borderColor: COLORS.link,
                boxShadow: `0 0 0 1px ${COLORS.link}`,
              }}
              _placeholder={{
                color: COLORS.secondary,
                fontSize: 'sm',
              }}
              min="8"
              max="64"
            />
            <Text fontSize="xs" color={COLORS.secondary} mt={0.5}>
              Recommended: 16-32 characters
            </Text>
          </FormControl>
        </VStack>
      </CardBody>
    </Card>
  );
};
