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
  Alert,
  AlertIcon,
  AlertDescription,
  Link,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';
import { generateDefaultSalt, SecretEntry } from '../crypto';
import { COLORS } from '../constants/colors';
import {
  SHARED_INPUT_STYLES,
  FORM_LABEL_STYLES,
  ACCORDION_BUTTON_STYLES,
  ACCORDION_HEADER_TEXT,
  ACCORDION_PANEL_STYLES,
} from '../constants/componentStyles';
import { useAppContext, useAppActions } from '../contexts/useAppContext';

export const EditCredential: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const actions = useAppActions();

  const { secrets, editingSecretIndex, currentView } = state;
  const isNewEntry = currentView === 'new';
  const secret = isNewEntry ? null : secrets[editingSecretIndex];

  // Track whether user wants to manually edit salt
  const [isEditingSalt, setIsEditingSalt] = useState(false);

  const [formData, setFormData] = useState({
    name: secret?.name || '',
    website: secret?.website || '',
    username: secret?.username || '',
    secret: secret?.secret || '',
    passwordLength: secret?.passwordLength || 16,
    includeSymbols: secret?.includeSymbols || false,
    salt:
      secret?.salt ||
      generateDefaultSalt({
        website: secret?.website,
        username: secret?.username,
      }),
  });

  // Auto-regenerate salt when website or username changes (only for new entries and unless manually editing)
  useEffect(() => {
    if (isNewEntry && !isEditingSalt) {
      const newSalt = generateDefaultSalt({
        website: formData.website,
        username: formData.username,
      });
      setFormData((prev) => ({
        ...prev,
        salt: newSalt,
      }));
    }
  }, [formData.website, formData.username, isEditingSalt, isNewEntry]);

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
      salt: formData.salt,
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

  const handleSaltToggle = () => {
    if (isEditingSalt) {
      // User wants to go back to auto-generated/original salt
      if (isNewEntry) {
        // For new entries, generate auto salt
        const autoSalt = generateDefaultSalt({
          website: formData.website,
          username: formData.username,
        });
        setFormData((prev) => ({
          ...prev,
          salt: autoSalt,
        }));
      } else {
        // For existing entries, revert to original salt
        setFormData((prev) => ({
          ...prev,
          salt: secret?.salt || '',
        }));
      }
    }
    setIsEditingSalt(!isEditingSalt);
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
      <CardBody pt={4} pb={4} px={3}>
        <Accordion defaultIndex={[0, 1, 2]} allowMultiple>
          {/* General Section */}
          <AccordionItem border="none" mb={4}>
            <AccordionButton {...ACCORDION_BUTTON_STYLES}>
              <Box flex="1" textAlign="left">
                <Text {...ACCORDION_HEADER_TEXT}>
                  General Information
                </Text>
              </Box>
              <AccordionIcon color={COLORS.secondary} />
            </AccordionButton>
            <AccordionPanel {...ACCORDION_PANEL_STYLES}>
              <VStack spacing={4}>
                {/* Name Field */}
                <FormControl>
                  <FormLabel {...FORM_LABEL_STYLES}>Display Name</FormLabel>
                  <Input
                    {...SHARED_INPUT_STYLES}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Google Account, Work Email"
                  />
                </FormControl>

                {/* Website Field */}
                <FormControl>
                  <FormLabel {...FORM_LABEL_STYLES}>Website URL</FormLabel>
                  <Input
                    {...SHARED_INPUT_STYLES}
                    value={formData.website}
                    onChange={(e) =>
                      handleInputChange('website', e.target.value)
                    }
                    placeholder="e.g., https://google.com, company.com"
                  />
                </FormControl>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* 2FA Section */}
          <AccordionItem border="none" mb={4}>
            <AccordionButton {...ACCORDION_BUTTON_STYLES}>
              <Box flex="1" textAlign="left">
                <Text {...ACCORDION_HEADER_TEXT}>
                  Two-Factor Authentication
                </Text>
              </Box>
              <AccordionIcon color={COLORS.secondary} />
            </AccordionButton>
            <AccordionPanel {...ACCORDION_PANEL_STYLES}>
              <VStack spacing={4}>
                {/* TOTP Secret Field */}
                <FormControl>
                  <FormLabel {...FORM_LABEL_STYLES}>
                    TOTP Secret{' '}
                    <Text
                      as="span"
                      color={COLORS.secondary}
                      fontWeight="normal"
                      fontSize="xs"
                      ml={1}
                    >
                      (Optional)
                    </Text>
                  </FormLabel>
                  <Input
                    {...SHARED_INPUT_STYLES}
                    fontFamily="mono"
                    value={formData.secret}
                    onChange={(e) =>
                      handleInputChange('secret', e.target.value)
                    }
                    placeholder="For 2FA authentication codes"
                  />
                </FormControl>
              </VStack>
            </AccordionPanel>
          </AccordionItem>

          {/* Password Section */}
          <AccordionItem border="none">
            <AccordionButton {...ACCORDION_BUTTON_STYLES}>
              <Box flex="1" textAlign="left">
                <Text {...ACCORDION_HEADER_TEXT}>
                  Password Generation
                </Text>
              </Box>
              <AccordionIcon color={COLORS.secondary} />
            </AccordionButton>
            <AccordionPanel {...ACCORDION_PANEL_STYLES}>
              <VStack spacing={4}>
                {/* Username Field */}
                <FormControl>
                  <FormLabel {...FORM_LABEL_STYLES}>Username / Email</FormLabel>
                  <Input
                    {...SHARED_INPUT_STYLES}
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange('username', e.target.value)
                    }
                    placeholder="e.g., john.doe@example.com"
                  />
                </FormControl>

                {/* Password Length Field */}
                <FormControl>
                  <FormLabel {...FORM_LABEL_STYLES}>Generated Password Length</FormLabel>
                  <Input
                    {...SHARED_INPUT_STYLES}
                    type="number"
                    value={formData.passwordLength}
                    onChange={(e) =>
                      handleInputChange(
                        'passwordLength',
                        parseInt(e.target.value) || 16,
                      )
                    }
                    placeholder="16"
                    min="8"
                    max="64"
                  />
                  <Text fontSize="xs" color={COLORS.secondary} mt={1}>
                    Recommended: 16-32 characters
                  </Text>
                </FormControl>

                {/* Salt Field */}
                <FormControl>
                  <HStack justify="space-between" align="center" mb={2}>
                    <FormLabel {...FORM_LABEL_STYLES} mb={0}>
                      Salt
                      <Text
                        as="span"
                        color={COLORS.secondary}
                        fontWeight="normal"
                        fontSize="xs"
                        ml={1}
                      >
                        {isNewEntry ? '(Auto-generated)' : '(From saved entry)'}
                      </Text>
                    </FormLabel>
                    <Link
                      color={COLORS.link}
                      fontSize="sm"
                      onClick={handleSaltToggle}
                      cursor="pointer"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      {isEditingSalt
                        ? isNewEntry
                          ? 'Use auto-generated'
                          : 'Use original'
                        : 'Edit manually'}
                    </Link>
                  </HStack>

                  {isEditingSalt && (
                    <Alert status="warning" mb={3} borderRadius="md" fontSize="sm">
                      <AlertIcon />
                      <AlertDescription fontSize="sm">
                        Manually editing the salt will affect password
                        generation.
                        {isNewEntry
                          ? ' The auto-generated salt ensures consistency across devices.'
                          : ' Changing the salt from the saved entry may result in different generated passwords.'}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Input
                    {...SHARED_INPUT_STYLES}
                    fontFamily="mono"
                    value={formData.salt}
                    onChange={(e) => handleInputChange('salt', e.target.value)}
                    placeholder={
                      isNewEntry
                        ? 'Auto-generated from website and username'
                        : 'Salt from the saved credential entry'
                    }
                    readOnly={!isEditingSalt}
                    bg={!isEditingSalt ? 'gray.50' : 'white'}
                    cursor={!isEditingSalt ? 'default' : 'text'}
                  />
                </FormControl>
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </CardBody>
    </Card>
  );
};
