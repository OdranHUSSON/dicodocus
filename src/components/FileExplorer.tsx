import React from 'react';
import { Box, Icon, HStack, Text, VStack, useDisclosure, IconButton, Tooltip } from '@chakra-ui/react';
import { FiFolder, FiFile, FiChevronRight, FiChevronDown, FiFolderPlus, FiFileText } from 'react-icons/fi';
import { CreateFileDialog } from './CreateFileDialog';

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
  onRefresh?: () => void;
  isRoot?: boolean;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  onFileSelect, 
  selectedFile,
  onRefresh,
  isRoot = true
}) => {
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set(['root']));
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentPath, setCurrentPath] = React.useState('/');
  const [createType, setCreateType] = React.useState<'file' | 'folder'>('file');

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreate = (path: string, type: 'file' | 'folder') => {
    setCurrentPath(path);
    setCreateType(type);
    onOpen();
  };

  const renderItem = (file: FileItem) => {
    const isFolder = file.type === 'folder';
    const isExpanded = expandedFolders.has(file.path);
    const isSelected = file.path === selectedFile;

    return (
      <Box key={file.path}>
        <HStack
          py={1.5}
          px={3}
          spacing={2}
          cursor="pointer"
          borderRadius="lg"
          bg={isSelected ? 'blue.50' : 'transparent'}
          _hover={{ 
            bg: isSelected ? 'blue.50' : 'gray.50',
            '& .folder-actions': { opacity: 1 }
          }}
          transition="all 0.2s"
          position="relative"
          role="group"
        >
          <HStack 
            flex={1} 
            spacing={3}
            onClick={() => isFolder ? toggleFolder(file.path) : onFileSelect(file)}
          >
            {isFolder && (
              <Icon 
                as={isExpanded ? FiChevronDown : FiChevronRight} 
                color="gray.400"
                transition="transform 0.2s"
                transform={isExpanded ? 'rotate(0deg)' : 'rotate(0deg)'}
              />
            )}
            <Icon 
              as={isFolder ? FiFolder : FiFile} 
              color={isFolder ? 'blue.400' : 'gray.500'}
              fontSize="1.1em" 
            />
            <Text 
              fontSize="sm" 
              fontWeight="medium"
              color={isSelected ? 'blue.600' : 'gray.700'}
            >
              {file.name}
            </Text>
          </HStack>
          
          {isFolder && (
            <HStack 
              spacing={1} 
              className="folder-actions"
              opacity={0}
              transition="all 0.2s"
              position="absolute"
              right={2}
              bg={isSelected ? 'blue.50' : 'white'}
              p={1}
              borderRadius="md"
              _groupHover={{ 
                opacity: 1,
                shadow: 'sm' 
              }}
            >
              <Tooltip label="New file" openDelay={500}>
                <IconButton
                  aria-label="New file"
                  icon={<FiFileText />}
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  _hover={{ color: 'blue.500', bg: 'blue.50' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreate(file.path, 'file');
                  }}
                />
              </Tooltip>
              <Tooltip label="New folder" openDelay={500}>
                <IconButton
                  aria-label="New folder"
                  icon={<FiFolderPlus />}
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  _hover={{ color: 'blue.500', bg: 'blue.50' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreate(file.path, 'folder');
                  }}
                />
              </Tooltip>
            </HStack>
          )}
        </HStack>
        {isFolder && isExpanded && file.children && (
          <Box pl={6}>
            <FileExplorer
              files={file.children}
              onFileSelect={onFileSelect}
              selectedFile={selectedFile}
              onRefresh={onRefresh}
              isRoot={false}
            />
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      {isRoot && (
        <Box p={2}>
          <HStack
            py={1.5}
            px={3}
            spacing={2}
            borderRadius="lg"
            bg="gray.50"
            _hover={{ 
              '& .folder-actions': { opacity: 1 }
            }}
            transition="all 0.2s"
            position="relative"
            role="group"
          >
            <HStack flex={1} spacing={3}>
              <Icon 
                as={FiChevronDown} 
                color="gray.400"
              />
              <Icon 
                as={FiFolder} 
                color="blue.400"
                fontSize="1.1em" 
              />
              <Text 
                fontSize="sm" 
                fontWeight="medium"
                color="gray.700"
              >
                Documents
              </Text>
            </HStack>
            
            <HStack 
              spacing={1} 
              className="folder-actions"
              opacity={0}
              transition="all 0.2s"
              position="absolute"
              right={2}
              bg="white"
              p={1}
              borderRadius="md"
              _groupHover={{ 
                opacity: 1,
                shadow: 'sm' 
              }}
            >
              <Tooltip label="New file" openDelay={500}>
                <IconButton
                  aria-label="New file"
                  icon={<FiFileText />}
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  _hover={{ color: 'blue.500', bg: 'blue.50' }}
                  onClick={() => handleCreate('/', 'file')}
                />
              </Tooltip>
              <Tooltip label="New folder" openDelay={500}>
                <IconButton
                  aria-label="New folder"
                  icon={<FiFolderPlus />}
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  _hover={{ color: 'blue.500', bg: 'blue.50' }}
                  onClick={() => handleCreate('/', 'folder')}
                />
              </Tooltip>
            </HStack>
          </HStack>
        </Box>
      )}
      <VStack align="stretch" spacing={0} pl={isRoot ? 6 : 0}>
        {files.map(renderItem)}
      </VStack>
      <CreateFileDialog
        isOpen={isOpen}
        onClose={onClose}
        currentPath={currentPath}
        initialType={createType}
        onFileCreated={() => {
          onRefresh?.();
          onClose();
        }}
      />
    </Box>
  );
};