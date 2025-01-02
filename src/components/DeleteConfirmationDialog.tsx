import React from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  Text,
  Icon,
  VStack,
} from '@chakra-ui/react';
import { FiAlertTriangle } from 'react-icons/fi';

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType: 'file' | 'folder';
  isLoading?: boolean;
}

export function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType,
  isLoading = false,
}: DeleteConfirmationDialogProps) {
  const cancelRef = React.useRef<HTMLButtonElement>(null);

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader padding={6} paddingBottom={0}>
            <VStack spacing={4} align="center">
              <Icon 
                as={FiAlertTriangle} 
                color="red.500" 
                boxSize={8} 
              />
              <Text fontSize="lg" fontWeight="bold">
                Delete {itemType}?
              </Text>
            </VStack>
          </AlertDialogHeader>

          <AlertDialogBody textAlign="center" paddingX={6}>
            Are you sure you want to delete <Text as="span" fontWeight="bold">{itemName}</Text>?
            {itemType === 'folder' && (
              <Text mt={2} color="red.500" fontSize="sm">
                This will delete all contents inside the folder.
              </Text>
            )}
          </AlertDialogBody>

          <AlertDialogFooter padding={6}>
            <Button ref={cancelRef} onClick={onClose}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={onConfirm}
              ml={3}
              isLoading={isLoading}
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}