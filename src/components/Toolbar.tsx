import React, { useState, Dispatch, SetStateAction } from 'react';
import {
  HStack,
  IconButton,
  Button,
  Divider,
  Tooltip,
  Text,
  ButtonGroup,
  Box,
  VStack,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItemOption,
  MenuOptionGroup,
  Progress,
} from '@chakra-ui/react';
import {
  FiSave,
  FiEdit,
  FiColumns,
  FiEye,
  FiImage,
  FiLink,
  FiBold,
  FiItalic,
  FiList,
  FiGlobe,
  FiMenu,
  FiCpu,
} from 'react-icons/fi';
import { LanguageSelector } from './LanguageSelector';
import { MediaLibrary } from './MediaLibrary';
import { editor } from 'monaco-editor';
import { insertTextAtCursor } from '@/utils/insertTextAtCursor';
import { AIDrawer } from './AIDrawer';


export type ViewMode = 'edit' | 'preview' | 'split';

export interface ToolbarProps {
  onSave: () => Promise<void>;
  onViewModeChange: Dispatch<SetStateAction<ViewMode>>;
  viewMode: ViewMode;
  fileName: string;
  currentLanguage: string;
  availableLanguages: Array<{ code: string; name: string }>;
  onLanguageChange: (lang: string) => void;
  filePath: string;
  contentType: 'docs' | 'blog' | 'pages';
  editorInstance: editor.IStandaloneCodeEditor | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onSave,
  onViewModeChange,
  viewMode,
  fileName,
  currentLanguage,
  availableLanguages,
  onLanguageChange,
  filePath,
  contentType,
  editorInstance
}) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMediaLibraryOpen, setIsMediaLibraryOpen] = useState(false);
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const toast = useToast();

  const handleImageSelect = (path: string) => {
    const imageMarkdown = `![](${path})\n`;
    insertTextAtCursor(editorInstance, imageMarkdown);
    setIsMediaLibraryOpen(false);
  };

  const handleSave = async () => {
    try {
      await onSave();
    } catch (err) {
      // Handle error if needed
      console.error('Error saving:', err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const handleTranslate = async () => {
    const toastId = toast({
      title: 'Translation in progress',
      description: (
        <Progress size="xs" isIndeterminate />
      ),
      status: 'info',
      duration: null,
      isClosable: false,
    });

    setIsTranslating(true);
    try {
      const response = await fetch('/api/files/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filePath,
          sourceLang: currentLanguage,
          targetLangs: selectedLanguages,
          contentType,
        }),
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      toast.close(toastId);
      toast({
        title: 'Translation complete',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast.close(toastId);
      toast({
        title: 'Translation failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleAIClick = () => {
    if (!editorInstance) return;

    const selection = editorInstance.getSelection();
    const model = editorInstance.getModel();
    
    if (!model) return;

    // Cas 1: Texte sélectionné
    if (selection && !selection.isEmpty()) {
      const selectedText = model.getValueInRange(selection);
      if (selectedText.trim()) {
        setSelectedText(selectedText);
        setIsAIDrawerOpen(true);
        return;
      }
    }

    // Cas 2: Curseur sur une ligne
    const position = editorInstance.getPosition();
    if (position) {
      const lineContent = model.getLineContent(position.lineNumber);
      if (lineContent.trim()) {
        setSelectedText(lineContent);
        setIsAIDrawerOpen(true);
        return;
      }
    }

    // Cas 3: Aucune sélection - ouvrir quand même le drawer
    setSelectedText('');
    setIsAIDrawerOpen(true);
  };

  return (
    <VStack spacing={0} width="100%">
      <HStack
        h="48px"
        px={4}
        spacing={4}
        bg="white"
        borderBottomWidth="1px"
        borderColor="gray.200"
        justify="space-between"
        align="center"
        w="full"
      >
        <HStack spacing={3} overflow="hidden">
          <Tooltip label="Save (⌘S)">
            <IconButton
              aria-label="Save"
              icon={<FiSave />}
              size="sm"
              variant="ghost"
              onClick={handleSave}
            />
          </Tooltip>
          
          <Box display={{ base: 'none', md: 'flex' }}>
            <HStack spacing={3}>
              <Divider orientation="vertical" h="24px" />
              <LanguageSelector
                currentLanguage={currentLanguage}
                availableLanguages={availableLanguages}
                onLanguageChange={onLanguageChange}
              />
              <Menu closeOnSelect={false}>
                <MenuButton as={Button} size="sm" variant="ghost" leftIcon={<FiGlobe />} isLoading={isTranslating}>
                  Translate
                </MenuButton>
                <MenuList minWidth='240px'>
                  <MenuOptionGroup type='checkbox' onChange={(values) => setSelectedLanguages(values as string[])}>
                    {availableLanguages
                      .filter(lang => lang.code !== currentLanguage)
                      .map(lang => (
                        <MenuItemOption key={lang.code} value={lang.code}>
                          {lang.name}
                        </MenuItemOption>
                      ))}
                  </MenuOptionGroup>
                  <Button
                    mt={2}
                    mx={3}
                    colorScheme="blue"
                    onClick={handleTranslate}
                    isDisabled={selectedLanguages.length === 0}
                    size="sm"
                    width="calc(100% - 24px)"
                  >
                    Translate
                  </Button>
                </MenuList>
              </Menu>
            </HStack>
          </Box>

          <Tooltip label="AI Assist (⌘⇧A)">
            <IconButton
              aria-label="AI Assist"
              icon={<FiCpu />}
              size="sm"
              variant="ghost"
              onClick={handleAIClick}
            />
          </Tooltip>
        </HStack>

        <Text 
          fontSize="sm" 
          color="gray.600" 
          fontWeight="medium"
          display={{ base: 'none', md: 'block' }}
        >
          {fileName}
        </Text>

        <ButtonGroup 
          size="sm" 
          isAttached 
          variant="outline"
          display={{ base: 'none', md: 'flex' }}
        >
          <Button
            leftIcon={<FiEdit />}
            isActive={viewMode === 'edit'}
            onClick={() => onViewModeChange('edit')}
            borderRightRadius={0}
          >
            Edit
          </Button>
          <Button
            leftIcon={<FiColumns />}
            isActive={viewMode === 'split'}
            onClick={() => onViewModeChange('split')}
            borderRadius={0}
          >
            Split
          </Button>
          <Button
            leftIcon={<FiEye />}
            isActive={viewMode === 'preview'}
            onClick={() => onViewModeChange('preview')}
            borderLeftRadius={0}
          >
            Preview
          </Button>
        </ButtonGroup>

        <Tooltip label="Insert Image">
          <IconButton
            aria-label="Insert Image"
            icon={<FiImage />}
            size="sm"
            variant="ghost"
            onClick={() => setIsMediaLibraryOpen(true)}
          />
        </Tooltip>

        <IconButton
          aria-label="Open menu"
          icon={<FiMenu />}
          size="sm"
          variant="ghost"
          display={{ base: 'flex', md: 'none' }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        />
      </HStack>

      <Box
        display={{ base: isMenuOpen ? 'block' : 'none', md: 'none' }}
        w="full"
        bg="white"
        borderBottomWidth="1px"
        borderColor="gray.200"
        p={4}
      >
        <VStack spacing={4} align="stretch">
          <Text fontSize="sm" color="gray.600" fontWeight="medium">
            {fileName}
          </Text>
          
          <HStack spacing={3}>
            <LanguageSelector
              currentLanguage={currentLanguage}
              availableLanguages={availableLanguages}
              onLanguageChange={onLanguageChange}
            />
            <Menu closeOnSelect={false}>
              <MenuButton as={Button} size="sm" variant="ghost" leftIcon={<FiGlobe />} isLoading={isTranslating}>
                Translate
              </MenuButton>
              <MenuList minWidth='240px'>
                <MenuOptionGroup type='checkbox' onChange={(values) => setSelectedLanguages(values as string[])}>
                  {availableLanguages
                    .filter(lang => lang.code !== currentLanguage)
                    .map(lang => (
                      <MenuItemOption key={lang.code} value={lang.code}>
                        {lang.name}
                      </MenuItemOption>
                    ))}
                </MenuOptionGroup>
                <Button
                  mt={2}
                  mx={3}
                  colorScheme="blue"
                  onClick={handleTranslate}
                  isDisabled={selectedLanguages.length === 0}
                  size="sm"
                  width="calc(100% - 24px)"
                >
                  Translate
                </Button>
              </MenuList>
            </Menu>
          </HStack>

          <ButtonGroup size="sm" isAttached variant="outline" width="full">
            <Button
              leftIcon={<FiEdit />}
              isActive={viewMode === 'edit'}
              onClick={() => {
                onViewModeChange('edit');
                setIsMenuOpen(false);
              }}
              flex={1}
              borderRightRadius={0}
            >
              Edit
            </Button>
            <Button
              leftIcon={<FiEye />}
              isActive={viewMode === 'preview'}
              onClick={() => {
                onViewModeChange('preview');
                setIsMenuOpen(false);
              }}
              flex={1}
              borderLeftRadius={0}
            >
              Preview
            </Button>
          </ButtonGroup>
        </VStack>
      </Box>

      <MediaLibrary
        isOpen={isMediaLibraryOpen}
        onClose={() => setIsMediaLibraryOpen(false)}
        onSelect={handleImageSelect}
      />

      <AIDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        selectedText={selectedText}
        editorInstance={editorInstance}
      />
    </VStack>
  );
};