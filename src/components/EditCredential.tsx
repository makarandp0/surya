import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  Card,
  CardHeader,
  CardBody,
  IconButton,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { FiSave, FiTrash2 } from 'react-icons/fi';
import { SecretEntry } from '../crypto';

interface EditCredentialProps {
  secrets: SecretEntry[];
  secretIndex: number;
  onSave: (index: number, updatedSecret: SecretEntry) => void;
  onDelete: (index: number) => void;
  onCancel: () => void;
  isNewEntry?: boolean;
}

export const EditCredential: React.FC<EditCredentialProps> = ({
  secrets,
  secretIndex,
  onSave,
  onDelete,
  onCancel,
  isNewEntry = false,
}) => {
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const secret = isNewEntry ? null : secrets[secretIndex];

  const [formData, setFormData] = useState({
    name: secret?.name || '',
    website: secret?.website || '',
    username: secret?.username || '',
    secret: secret?.secret || '',
    passwordLength: secret?.passwordLength || 16,
    includeSymbols: secret?.includeSymbols || false,
  });

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

  const handleSave = () => {
    const updatedSecret: SecretEntry = {
      ...(secret || {}),
      name: formData.name,
      website: formData.website,
      username: formData.username,
      secret: formData.secret,
      passwordLength: formData.passwordLength,
      includeSymbols: formData.includeSymbols,
    };

    onSave(secretIndex, updatedSecret);
    toast({
      title: isNewEntry ? 'Entry Created' : 'Secret Updated',
      description: isNewEntry
        ? 'Your new entry has been created successfully.'
        : 'Your changes have been saved successfully.',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const handleDelete = () => {
    onOpen();
  };

  const confirmDelete = () => {
    onDelete(secretIndex);
    toast({
      title: 'Secret Deleted',
      description: 'The secret has been removed.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
    onClose();
  };

  const handleCancel = () => {
    onCancel();
  };

  return (
    <>
      <VStack spacing={4} w="full" p={4}>
        {/* Delete button for existing entries */}
        {!isNewEntry && (
          <HStack w="full" justify="flex-end">
            <IconButton
              aria-label="Delete secret"
              icon={<FiTrash2 />}
              colorScheme="red"
              variant="ghost"
              onClick={handleDelete}
            />
          </HStack>
        )}

        {/* Edit Form */}
        <Card w="full" maxW="md">
          <CardHeader pb={2}>
            <Text fontSize="md" fontWeight="medium">
              Secret Details
            </Text>
          </CardHeader>
          <CardBody pt={0}>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel fontSize="sm">Name</FormLabel>
                <Input
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter credential name"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Website</FormLabel>
                <Input
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  placeholder="Enter website URL"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Username</FormLabel>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange('username', e.target.value)
                  }
                  placeholder="Enter username"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">TOTP Secret (Optional)</FormLabel>
                <Input
                  value={formData.secret}
                  onChange={(e) => handleInputChange('secret', e.target.value)}
                  placeholder="Enter TOTP secret"
                />
              </FormControl>

              <FormControl>
                <FormLabel fontSize="sm">Password Length</FormLabel>
                <Input
                  type="number"
                  value={formData.passwordLength}
                  onChange={(e) =>
                    handleInputChange(
                      'passwordLength',
                      parseInt(e.target.value) || 16,
                    )
                  }
                  placeholder="Password length"
                  min="8"
                  max="64"
                />
              </FormControl>
            </VStack>
          </CardBody>
        </Card>

        {/* Action Buttons */}
        <HStack spacing={3} w="full" maxW="md">
          <Button variant="outline" flex={1} onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            flex={1}
            leftIcon={<FiSave />}
            onClick={handleSave}
          >
            {isNewEntry ? 'Create Entry' : 'Save Changes'}
          </Button>
        </HStack>
      </VStack>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Delete Secret</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            Are you sure you want to delete this secret? This action cannot be
            undone.
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="red" onClick={confirmDelete}>
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
