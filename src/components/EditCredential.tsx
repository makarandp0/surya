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

interface EditCredentialProps {
  secrets: SecretEntry[];
  secretIndex: number;
  onSave: (index: number, updatedSecret: SecretEntry) => void;
  onDelete: (index: number) => void;
  onCancel: () => void;
  isNewEntry?: boolean;
  onFormDataChange?: (formData: SecretEntry) => void;
}

export const EditCredential: React.FC<EditCredentialProps> = ({
  secrets,
  secretIndex,
  onSave: _onSave,
  onDelete: _onDelete,
  onCancel,
  isNewEntry = false,
  onFormDataChange,
}) => {
  const secret = isNewEntry ? null : secrets[secretIndex];

  const [formData, setFormData] = useState({
    name: secret?.name || '',
    website: secret?.website || '',
    username: secret?.username || '',
    secret: secret?.secret || '',
    passwordLength: secret?.passwordLength || 16,
    includeSymbols: secret?.includeSymbols || false,
  });

  // Pass current form data to parent for footer actions
  useEffect(() => {
    const currentFormAsSecret: SecretEntry = {
      ...(secret || {}),
      name: formData.name,
      website: formData.website,
      username: formData.username,
      secret: formData.secret,
      passwordLength: formData.passwordLength,
      includeSymbols: formData.includeSymbols,
    };
    onFormDataChange?.(currentFormAsSecret);
  }, [formData, secret, onFormDataChange]);

  if (!isNewEntry && (secretIndex === -1 || !secret)) {
    return (
      <Box p={4}>
        <Text color="red.500">Secret not found</Text>
        <Button onClick={onCancel} mt={4}>
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
    <>
      <VStack spacing={4} w="full" p={4} pt={2}>
        {/* Edit Form */}
        <Card
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
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color={COLORS.primary}
                  mb={1.5}
                  letterSpacing="0.01em"
                >
                  Display Name
                </FormLabel>
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
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color={COLORS.primary}
                  mb={1.5}
                  letterSpacing="0.01em"
                >
                  Website URL
                </FormLabel>
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
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color={COLORS.primary}
                  mb={1.5}
                  letterSpacing="0.01em"
                >
                  Username / Email
                </FormLabel>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange('username', e.target.value)
                  }
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
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color={COLORS.primary}
                  mb={1.5}
                  letterSpacing="0.01em"
                >
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
                <FormLabel
                  fontSize="sm"
                  fontWeight="medium"
                  color={COLORS.primary}
                  mb={1.5}
                  letterSpacing="0.01em"
                >
                  Generated Password Length
                </FormLabel>
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
      </VStack>
    </>
  );
};
