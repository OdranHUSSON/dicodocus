import React from 'react';
import {
  Box,
  Text,
  VStack,
  Badge,
  List,
  ListItem,
  Button,
  useToast,
} from '@chakra-ui/react';
import { FiGlobe } from 'react-icons/fi';
import { TranslateModal } from './TranslateModal';

interface MissingTranslation {
  path: string;
  missingIn: string[];
}

interface Props {
  onFileSelect: (path: string) => void;
  availableLanguages: { code: string; name: string }[];
}

export function MissingTranslations({ onFileSelect, availableLanguages }: Props) {
  const [missingTranslations, setMissingTranslations] = React.useState<MissingTranslation[]>([]);
  const [loadingItems, setLoadingItems] = React.useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = React.useState<{path: string, missingIn: string[]} | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const toast = useToast();

  const fetchMissingTranslations = async () => {
    try {
      const response = await fetch('/api/files/missing-translations');
      if (!response.ok) throw new Error('Failed to fetch missing translations');
      const data = await response.json();
      setMissingTranslations(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch missing translations',
        status: 'error',
        duration: 3000,
      });
    }
  };

  React.useEffect(() => {
    fetchMissingTranslations();
  }, []);

  const handleFixClick = (item: MissingTranslation) => {
    setSelectedFile(item);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedFile(null);
    fetchMissingTranslations();
  };

  return (
    <Box p={4}>
      <VStack align="stretch" spacing={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Text fontSize="sm" fontWeight="semibold">
            Missing Translations
          </Text>
          <Button
            size="xs"
            onClick={fetchMissingTranslations}
            isLoading={loadingItems.size > 0}
          >
            Refresh
          </Button>
        </Box>
        
        {missingTranslations.length === 0 ? (
          <Text fontSize="sm" color="gray.500">
            All documents are translated
          </Text>
        ) : (
          <List spacing={2}>
            {missingTranslations.map((item) => (
              <ListItem
                key={item.path}
                p={2}
                borderWidth="1px"
                borderRadius="md"
                _hover={{ bg: 'gray.50' }}
              >
                <Box>
                  <Text 
                    fontSize="sm" 
                    fontWeight="medium"
                    cursor="pointer"
                    onClick={() => onFileSelect(item.path)}
                    mb={1}
                  >
                    {item.path}
                  </Text>
                  <Box mb={2}>
                    {item.missingIn.map((lang) => (
                      <Badge
                        key={lang}
                        mr={1}
                        colorScheme="orange"
                        fontSize="xs"
                        bg="orange.50"
                        color="orange.800"
                      >
                        {lang}
                      </Badge>
                    ))}
                  </Box>
                  <Button
                    size="sm"
                    leftIcon={<FiGlobe />}
                    colorScheme="blue"
                    onClick={() => handleFixClick(item)}
                    height="24px"
                    fontSize="sm"
                    px={3}
                  >
                    Fix
                  </Button>
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </VStack>

      {selectedFile && (
        <TranslateModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          availableLanguages={availableLanguages}
          currentLanguage="en"
          filePath={selectedFile.path}
        />
      )}
    </Box>
  );
}