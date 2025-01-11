import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useToast,
} from '@chakra-ui/react';

interface CreateFileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  initialType: 'file' | 'folder';
  contentType: 'docs' | 'blog' | 'pages';
  onFileCreated: () => void;
}

export function CreateFileDialog({ 
  isOpen, 
  onClose, 
  currentPath, 
  initialType = 'file',
  contentType,
  onFileCreated 
}: CreateFileDialogProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'file' | 'folder'>(initialType);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Reset type when dialog opens
  useEffect(() => {
    if (isOpen) {
      setType(initialType);
      setName('');
    }
  }, [isOpen, initialType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Construct the full path
      const newPath = `${currentPath}/${name}${type === 'file' ? '.md' : ''}`;

      const response = await fetch('/api/files/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: newPath,
          type,
          contentType,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create file');
      }

      toast({
        title: 'Success',
        description: `${type} created successfully`,
        status: 'success',
        duration: 3000,
      });

      onFileCreated();
      onClose();
      setName('');
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to create ${type}`,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <form onSubmit={handleSubmit}>
          <ModalHeader>Create New {type}</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Type</FormLabel>
                <Select value={type} onChange={(e) => setType(e.target.value as 'file' | 'folder')}>
                  <option value="file">File</option>
                  <option value="folder">Folder</option>
                </Select>
              </FormControl>
              <FormControl>
                <FormLabel>Name</FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={type === 'file' ? 'filename' : 'folder name'}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={isLoading}
              isDisabled={!name.trim()}
            >
              Create
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}