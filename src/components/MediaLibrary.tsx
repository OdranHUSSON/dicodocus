import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  VStack,
  HStack,
  Image,
  Text,
  Input,
  Button,
  Grid,
  Box,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from '@chakra-ui/react';
import { FiUpload, FiCopy, FiTrash2 } from 'react-icons/fi';

interface MediaItem {
  id: string;
  name: string;
  description: string;
  path: string;
  createdAt: string;
  size: number;
}

interface MediaLibraryProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
}

export function MediaLibrary({ isOpen, onClose, onSelect }: MediaLibraryProps) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const toast = useToast();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await fetch('/api/media');
      const data = await response.json();
      setItems(data.items);
    } catch (error) {
      toast({
        title: 'Error fetching media',
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handlePaste = async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') === 0) {
        const file = item.getAsFile();
        if (file) {
          await uploadFile(file);
        }
      }
    }
  };

  const uploadFile = async (file: File) => {
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Upload failed');
      
      const newItem = await response.json();
      setItems(prev => [...prev, newItem]);
      
      toast({
        title: 'File uploaded successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering onSelect
    setItemToDelete(id);
    onDeleteOpen();
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    
    try {
      const response = await fetch(`/api/media?id=${itemToDelete}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Delete failed');
      
      setItems(prev => prev.filter(item => item.id !== itemToDelete));
      
      toast({
        title: 'File deleted successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Delete failed',
        status: 'error',
        duration: 3000,
      });
    } finally {
      onDeleteClose();
      setItemToDelete(null);
    }
  };

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, []);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Media Library</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <HStack>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                  }}
                  display="none"
                  id="file-upload"
                />
                <Button
                  as="label"
                  htmlFor="file-upload"
                  leftIcon={<FiUpload />}
                  isLoading={isUploading}
                >
                  Upload Image
                </Button>
                <Text fontSize="sm" color="gray.500">
                  or paste an image from clipboard
                </Text>
              </HStack>

              <Grid templateColumns="repeat(auto-fill, minmax(150px, 1fr))" gap={4}>
                {items.map((item) => (
                  <Box
                    key={item.id}
                    borderWidth={1}
                    borderRadius="md"
                    overflow="hidden"
                    cursor="pointer"
                    onClick={() => onSelect(item.path)}
                    _hover={{ shadow: 'md' }}
                    position="relative"
                    role="group"
                  >
                    <Button
                      size="sm"
                      position="absolute"
                      top={1}
                      right={1}
                      colorScheme="red"
                      onClick={(e) => handleDelete(item.id, e)}
                      opacity={0}
                      _groupHover={{ opacity: 1 }}
                      variant="solid"
                    >
                      <FiTrash2 />
                    </Button>
                    <Image
                      src={`/img/${item.path.split('/').pop()}`}
                      alt={item.name}
                      height="100px"
                      width="100%"
                      objectFit="cover"
                    />
                    <Box p={2}>
                      <Text fontSize="sm" noOfLines={1}>
                        {item.name}
                      </Text>
                    </Box>
                  </Box>
                ))}
              </Grid>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Image
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure? This action cannot be undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmDelete} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}