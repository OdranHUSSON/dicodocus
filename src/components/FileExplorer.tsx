import React from 'react';
import { Box, Icon, HStack, Text, VStack, useDisclosure, IconButton, Tooltip, Center, useToast } from '@chakra-ui/react';
import { FiFolder, FiFile, FiChevronRight, FiChevronDown, FiFolderPlus, FiFileText, FiInbox, FiTrash2, FiChevronsRight, FiChevronsDown } from 'react-icons/fi';
import { CreateFileDialog } from './CreateFileDialog';
import { DeleteConfirmationDialog } from './DeleteConfirmationDialog';

export interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileItem[];
  contentType: 'docs' | 'blog' | 'pages';
}

interface FileExplorerProps {
  files: {
    docs: FileItem[];
    blog: FileItem[];
    pages: FileItem[];
  };
  onFileSelect: (file: FileItem) => void;
  selectedFile?: string;
  onRefresh?: () => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ 
  files, 
  onFileSelect, 
  selectedFile,
  onRefresh
}) => {
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set(['root', 'docs', 'blog', 'pages']));
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentPath, setCurrentPath] = React.useState('/');
  const [createType, setCreateType] = React.useState<'file' | 'folder'>('file');
  const [currentContentType, setCurrentContentType] = React.useState<'docs' | 'blog' | 'pages'>('docs');
  const [itemToDelete, setItemToDelete] = React.useState<FileItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const toast = useToast();

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const handleCreate = (path: string, type: 'file' | 'folder', contentType: 'docs' | 'blog' | 'pages') => {
    setCurrentPath(path);
    setCreateType(type);
    setCurrentContentType(contentType);
    onOpen();
  };

  const handleDelete = async (file: FileItem) => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: file.path,
          contentType: file.contentType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast({
        title: 'Success',
        description: `${file.type === 'folder' ? 'Folder' : 'File'} deleted successfully`,
        status: 'success',
        duration: 3000,
      });

      onRefresh?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to delete ${file.type}`,
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const renderFileTree = (fileItems: FileItem[], contentType: 'docs' | 'blog' | 'pages') => {
    return fileItems.map(file => {
      const isFolder = file.type === 'folder';
      const isExpanded = expandedFolders.has(file.path);
      const isSelected = file.path === selectedFile;

      const fileWithType = { ...file, contentType };

      return (
        <Box key={`${contentType}-${file.path}`}>
          <HStack
            py={1.5}
            px={3}
            spacing={2}
            cursor="pointer"
            borderRadius="lg"
            bg={isSelected ? 'blue.50' : 'transparent'}
            _hover={{ 
              bg: isSelected ? 'blue.50' : 'gray.50',
              '& .item-actions': { opacity: 1 }
            }}
            transition="all 0.2s"
            position="relative"
            role="group"
          >
            <HStack 
              flex={1} 
              spacing={3}
              onClick={() => isFolder ? toggleFolder(file.path) : onFileSelect(fileWithType)}
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
            
            <HStack 
              spacing={1} 
              className="item-actions"
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
              {isFolder ? (
                <>
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
                        handleCreate(file.path, 'file', contentType);
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
                        handleCreate(file.path, 'folder', contentType);
                      }}
                    />
                  </Tooltip>
                </>
              ) : null}
              <Tooltip label="Delete" openDelay={500}>
                <IconButton
                  aria-label="Delete"
                  icon={<FiTrash2 />}
                  size="xs"
                  variant="ghost"
                  color="gray.500"
                  _hover={{ color: 'red.500', bg: 'red.50' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete({ ...file, contentType });
                  }}
                />
              </Tooltip>
            </HStack>
          </HStack>
          {isFolder && isExpanded && file.children && (
            <Box pl={6}>
              {renderFileTree(file.children, contentType)}
            </Box>
          )}
        </Box>
      );
    });
  };

  const renderEmptyState = () => (
    <Center 
      py={8} 
      px={4}
      color="gray.500"
    >
      <VStack spacing={3}>
        <Icon 
          as={FiInbox} 
          fontSize="2xl"
          color="gray.400"
        />
        <Text 
          fontSize="sm" 
          color="gray.500"
          textAlign="center"
        >
          This folder is empty
        </Text>
        <HStack 
          spacing={2}
          opacity={0.8}
          _hover={{ opacity: 1 }}
          transition="opacity 0.2s"
        >
          <IconButton
            aria-label="New file"
            icon={<FiFileText />}
            size="sm"
            variant="ghost"
            color="gray.500"
            _hover={{ color: 'blue.500', bg: 'blue.50' }}
            onClick={() => handleCreate(currentPath, 'file', currentContentType)}
          />
          <IconButton
            aria-label="New folder"
            icon={<FiFolderPlus />}
            size="sm"
            variant="ghost"
            color="gray.500"
            _hover={{ color: 'blue.500', bg: 'blue.50' }}
            onClick={() => handleCreate(currentPath, 'folder', currentContentType)}
          />
        </HStack>
      </VStack>
    </Center>
  );

  return (
    <Box>
      <VStack align="stretch" spacing={4}>
        {/* Documentation Section */}
        <Box>
          <HStack
            py={1.5}
            px={3}
            spacing={2}
            borderRadius="lg"
            bg="gray.50"
            cursor="pointer"
            onClick={() => toggleFolder('docs')}
            _hover={{ 
              '& .folder-actions': { opacity: 1 }
            }}
            position="relative"
            role="group"
          >
            <HStack flex={1} spacing={3}>
              <Icon 
                as={expandedFolders.has('docs') ? FiChevronsDown : FiChevronsRight} 
                color="gray.400"
              />
              <Icon as={FiFolder} color="blue.400" fontSize="1.1em" />
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Documentation
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
              _groupHover={{ opacity: 1, shadow: 'sm' }}
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
                    handleCreate('/', 'file', 'docs');
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
                    handleCreate('/', 'folder', 'docs');
                  }}
                />
              </Tooltip>
            </HStack>
          </HStack>
          {expandedFolders.has('docs') && (
            <Box pl={6}>
              {files.docs.length > 0 ? renderFileTree(files.docs, 'docs') : renderEmptyState()}
            </Box>
          )}
        </Box>

        {/* Blog Section */}
        <Box>
          <HStack
            py={1.5}
            px={3}
            spacing={2}
            borderRadius="lg"
            bg="gray.50"
            cursor="pointer"
            onClick={() => toggleFolder('blog')}
            _hover={{ 
              '& .folder-actions': { opacity: 1 }
            }}
            position="relative"
            role="group"
          >
            <HStack flex={1} spacing={3}>
              <Icon 
                as={expandedFolders.has('blog') ? FiChevronDown : FiChevronRight} 
                color="gray.400"
              />
              <Icon as={FiFolder} color="green.400" fontSize="1.1em" />
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Blog
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
              _groupHover={{ opacity: 1, shadow: 'sm' }}
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
                    handleCreate('/', 'file', 'blog');
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
                    handleCreate('/', 'folder', 'blog');
                  }}
                />
              </Tooltip>
            </HStack>
          </HStack>
          {expandedFolders.has('blog') && (
            <Box pl={6}>
              {files.blog.length > 0 ? renderFileTree(files.blog, 'blog') : renderEmptyState()}
            </Box>
          )}
        </Box>

        {/* Pages Section */}
        <Box>
          <HStack
            py={1.5}
            px={3}
            spacing={2}
            borderRadius="lg"
            bg="gray.50"
            cursor="pointer"
            onClick={() => toggleFolder('pages')}
            _hover={{ 
              '& .folder-actions': { opacity: 1 }
            }}
            position="relative"
            role="group"
          >
            <HStack flex={1} spacing={3}>
              <Icon 
                as={expandedFolders.has('pages') ? FiChevronDown : FiChevronRight} 
                color="gray.400"
              />
              <Icon as={FiFolder} color="purple.400" fontSize="1.1em" />
              <Text fontSize="sm" fontWeight="medium" color="gray.700">
                Pages
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
              _groupHover={{ opacity: 1, shadow: 'sm' }}
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
                    handleCreate('/', 'file', 'pages');
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
                    handleCreate('/', 'folder', 'pages');
                  }}
                />
              </Tooltip>
            </HStack>
          </HStack>
          {expandedFolders.has('pages') && (
            <Box pl={6}>
              {files.pages.length > 0 ? renderFileTree(files.pages, 'pages') : renderEmptyState()}
            </Box>
          )}
        </Box>

      </VStack>

      <CreateFileDialog
        isOpen={isOpen}
        onClose={onClose}
        currentPath={currentPath}
        initialType={createType}
        contentType={currentContentType}
        onFileCreated={() => {
          onRefresh?.();
          onClose();
        }}
      />
      <DeleteConfirmationDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => itemToDelete && handleDelete(itemToDelete)}
        itemName={itemToDelete?.name || ''}
        itemType={itemToDelete?.type || 'file'}
        isLoading={isDeleting}
      />
    </Box>
  );
};