import React from 'react';
import { Box, Icon, HStack, Text, VStack } from '@chakra-ui/react';
import { FiFolder, FiFile, FiChevronRight, FiChevronDown } from 'react-icons/fi';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileItem[];
}

interface FileExplorerProps {
  files: FileItem[];
  onFileSelect: (file: FileItem) => void;
  selectedFile?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ files, onFileSelect, selectedFile }) => {
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const renderItem = (file: FileItem) => {
    const isFolder = file.type === 'folder';
    const isExpanded = expandedFolders.has(file.path);
    const isSelected = file.path === selectedFile;

    return (
      <Box key={file.path}>
        <HStack
          py={1}
          px={2}
          spacing={2}
          cursor="pointer"
          borderRadius="md"
          bg={isSelected ? 'blue.50' : 'transparent'}
          _hover={{ bg: isSelected ? 'blue.50' : 'gray.50' }}
          onClick={() => isFolder ? toggleFolder(file.path) : onFileSelect(file)}
        >
          {isFolder && (
            <Icon as={isExpanded ? FiChevronDown : FiChevronRight} color="gray.500" />
          )}
          <Icon as={isFolder ? FiFolder : FiFile} color={isFolder ? 'blue.500' : 'gray.500'} />
          <Text fontSize="sm">{file.name}</Text>
        </HStack>
        {isFolder && isExpanded && file.children && (
          <Box pl={4}>
            <FileExplorer
              files={file.children}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
            />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <VStack align="stretch" spacing={0}>
      {files.map(renderItem)}
    </VStack>
  );
};