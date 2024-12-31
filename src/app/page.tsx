'use client'

import React, { useEffect, useState } from 'react';
import { Box, HStack, Text, useToast, VStack, IconButton, Tabs, TabList, TabPanel, TabPanels, Tab } from '@chakra-ui/react';
import { FileExplorer } from '@/components/FileExplorer';
import { Toolbar } from '@/components/Toolbar';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import ChakraUIRenderer, {  defaults } from 'chakra-ui-markdown-renderer';
import { theme } from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon } from '@chakra-ui/icons';
import { editor } from 'monaco-editor';
import { uploadImageFromClipboard } from '@/utils/uploadImageFromClipboard';
import * as monaco from 'monaco-editor';
import { MissingTranslations } from '@/components/MissingTranslations';

interface FileItem {
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileItem[];
}

type ViewMode = 'edit' | 'preview' | 'split';

interface Language {
  code: string;
  name: string;
}

// Add error type for toast description
type ToastError = Error | { message: string };

// Add these constants at the top of the file
const STORAGE_KEYS = {
  SELECTED_FILE: 'docs-editor-selected-file',
  VIEW_MODE: 'docs-editor-view-mode',
  CURRENT_LANGUAGE: 'docs-editor-language',
  SIDEBAR_STATE: 'docs-editor-sidebar-state'
};

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'lu', name: 'Luxembourgish' },
];

export default function HomePage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [currentLanguage, setCurrentLanguage] = useState('');
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [contentLanguage, setContentLanguage] = useState<string>('en');
  const toast = useToast();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [editorInstance, setEditorInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const languageMap: Record<string, string> = {
    en: 'English',
    fr: 'Français',
    de: 'Deutsch',
    lu: 'Lëtzebuergesch',
  };

  useEffect(() => {
    async function fetchFiles() {
      try {
        const response = await fetch('/api/files');
        if (!response.ok) {
          throw new Error('Failed to fetch files');
        }
        const data = await response.json();
        setFiles(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      }
    }

    fetchFiles();
  }, []);

  // Separate the language loading into its own effect
  useEffect(() => {
    const savedLanguage = localStorage.getItem(STORAGE_KEYS.CURRENT_LANGUAGE);
    if (savedLanguage) {
      setCurrentLanguage(savedLanguage);
    }
    setIsInitialized(true);
  }, []); // Run once on mount

  // Load other preferences and file after language is initialized
  useEffect(() => {
    if (!isInitialized) return;

    // Load view mode
    const savedViewMode = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }

    // Load sidebar state
    const savedSidebarState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
    if (savedSidebarState !== null) {
      setSidebarOpen(savedSidebarState === 'true');
    }

    // Load saved file
    const savedFile = localStorage.getItem(STORAGE_KEYS.SELECTED_FILE);
    if (savedFile) {
      try {
        const fileData = JSON.parse(savedFile);
        handleFileSelect(fileData);
      } catch (error) {
        console.error('Error loading saved file:', error);
      }
    }
  }, [isInitialized, currentLanguage]); // Depend on initialization and language

  // Save view mode changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  // Save language changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_LANGUAGE, currentLanguage);
  }, [currentLanguage]);

  // Save sidebar state changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SIDEBAR_STATE, isSidebarOpen.toString());
  }, [isSidebarOpen]);

  // Save selected file changes
  useEffect(() => {
    if (selectedFile) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_FILE, JSON.stringify(selectedFile));
    }
  }, [selectedFile]);

  const handleFileSelect = async (file: FileItem | null) => {
    if (!isInitialized) return;
    if (!file) {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_FILE);
      setSelectedFile(null);
      setFileContent('');
      return;
    }

    if (file.type === 'file') {
      try {
        const response = await fetch(
          `/api/files/content?path=${encodeURIComponent(file.path)}&lang=${currentLanguage}`
        );
        
        if (!response.ok) throw new Error('Failed to fetch file content');
        
        const data = await response.json();
        setFileContent(data.content);
        setContentLanguage(data.language);
        setAvailableLanguages(
          data.availableLanguages.map((code: string) => ({
            code,
            name: languageMap[code] || code,
          }))
        );
        setSelectedFile(file);
      } catch (err) {
        toast({
          title: 'Error loading file',
          description: (err as ToastError).message,
          status: 'error',
          duration: 3000,
        });
      }
    }
  };

  const handleSave = async (contentToSave?: string) => {
    if (!selectedFile) return;

    // Use the provided content or fall back to fileContent state
    const finalContent = contentToSave ?? fileContent;

    try {
      const response = await fetch('/api/files/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: selectedFile.path,
          content: finalContent,
          language: currentLanguage
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to save file' }));
        throw new Error(errorData.message || 'Failed to save file');
      }

      const data = await response.json();
      
      // Update available languages after save
      setAvailableLanguages(
        data.availableLanguages.map((code: string) => ({
          code,
          name: languageMap[code] || code,
        }))
      );

      toast({
        title: 'Success',
        description: 'File saved successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (err) {
      // Safely extract error message
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred while saving';
      
      console.error('Save error:', errorMessage);
      toast({
        title: 'Error saving file',
        description: errorMessage,
        status: 'error',
        duration: 3000,
      });
    }
  };

  const handleLanguageChange = async (lang: string) => {
    if (!selectedFile) return;
    
    try {
      const response = await fetch(
        `/api/files/content?path=${encodeURIComponent(selectedFile.path)}&lang=${lang}`
      );
      
      if (!response.ok) throw new Error('Failed to fetch translation');
      
      const data = await response.json();
      setFileContent(data.content);
      setCurrentLanguage(lang);
      localStorage.setItem(STORAGE_KEYS.CURRENT_LANGUAGE, lang);
      setContentLanguage(data.language);
      setAvailableLanguages(
        data.availableLanguages.map((code: string) => ({
          code,
          name: languageMap[code] || code,
        }))
      );
    } catch (err) {
      toast({
        title: 'Language switch failed',
        description: (err as ToastError).message,
        status: 'error',
        duration: 3000,
      });
    }
  };

  // Custom theme overrides for the markdown renderer
  const markdownTheme = {
    ...defaults,
    // Customize specific elements if needed
    h1: (props: any) => {
      const { children } = props;
      return (
        <Text
          as="h1"
          fontSize="2xl"
          fontWeight="bold"
          mb={4}
          mt={6}
          color="gray.900"
        >
          {children}
        </Text>
      );
    },
    // Add more custom components as needed
  };

  const handleEditorDidMount = (editor: editor.IStandaloneCodeEditor) => {
    setEditorInstance(editor);
    
    // Update the command handler to use a closure that captures the current language
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      const currentContent = editor.getValue();
      handleSave(currentContent);
    });
    
    // Create a paste handler that first checks for images
    editor.onKeyDown((e: any) => {
      if ((e.ctrlKey || e.metaKey) && e.keyCode === monaco.KeyCode.KeyV) {
        handlePaste(editor);
      }
    });
  };

  const handlePaste = async (editor: editor.IStandaloneCodeEditor) => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      let hasHandledImage = false;

      for (const item of clipboardItems) {
        if (item.types.includes('image/png') || item.types.includes('image/jpeg')) {
          hasHandledImage = true;
          const blob = await item.getType(item.types[0]);
          const file = new File([blob], 'pasted-image.png', { type: item.types[0] });

          const formData = new FormData();
          formData.append('file', file);

          const response = await fetch('/api/media', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) throw new Error('Upload failed');
          
          const data = await response.json();
          
          const selection = editor.getSelection();
          if (selection) {
            const imageMarkdown = `![${data.name}](${data.path})`;
            editor.executeEdits('', [{
              range: selection,
              text: imageMarkdown,
            }]);
          }

          toast({
            title: 'Image uploaded successfully',
            status: 'success',
            duration: 3000,
          });
          break;
        }
      }

      // If no image was handled, let the default paste happen
      if (!hasHandledImage) {
        return true; // Allow the default paste behavior
      }
      return false; // Prevent default only if we handled an image
    } catch (error) {
      console.error('Paste error:', error);
      return true; // Allow default paste on error
    }
  };

  // Add a cleanup function to clear storage when needed
  const clearEditorState = () => {
    localStorage.removeItem(STORAGE_KEYS.SELECTED_FILE);
    localStorage.removeItem(STORAGE_KEYS.VIEW_MODE);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_LANGUAGE);
    localStorage.removeItem(STORAGE_KEYS.SIDEBAR_STATE);
  };

  // Optional: Add this to your error handlers to clear state when something goes wrong
  const handleError = (error: any) => {
    console.error('Error:', error);
    clearEditorState();
    // ... handle error ...
  };

  // Add this effect to reload file content when language changes
  useEffect(() => {
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  }, [currentLanguage]); // Dependency on currentLanguage

  // Add this helper function
  const handleMissingTranslationSelect = async (filePath: string) => {
    // Find the file in the files array
    const findFile = (items: FileItem[]): FileItem | null => {
      for (const item of items) {
        if (item.path === filePath) return item;
        if (item.children) {
          const found = findFile(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findFile(files);
    if (file) {
      await handleFileSelect(file);
    }
  };

  // Add this effect to update the save command when language changes
  useEffect(() => {
    if (editorInstance) {
      editorInstance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        const currentContent = editorInstance.getValue();
        handleSave(currentContent);
      });
    }
  }, [currentLanguage, editorInstance]);

  return (
    <Box h="100vh" display="flex" flexDirection="column">
      {/* Top App Bar */}
      <Box
        h="40px"
        bg="gray.100"
        borderBottomWidth="1px"
        borderColor="gray.200"
        className="app-region-drag"
        display="flex"
        alignItems="center"
        px={4}
        gap={2}
      >
        <IconButton
          icon={isSidebarOpen ? <CloseIcon /> : <HamburgerIcon />}
          variant="ghost"
          size="sm"
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="app-region-no-drag"
          aria-label="Toggle Sidebar"
        />
        <Text fontSize="sm" color="gray.600">
          Docs Editor
        </Text>
      </Box>

      {/* Main Content */}
      <HStack flex={1} spacing={0} align="stretch" overflow="hidden">
        {/* Sidebar */}
        <Box
          w={{ base: "full", md: "250px" }}
          position={{ base: "fixed", md: "relative" }}
          h={{ base: "100vh", md: "auto" }}
          zIndex={20}
          borderRightWidth="1px"
          borderColor="gray.200"
          bg="white"
          display="flex"
          flexDir="column"
          overflow="hidden"
          transform={{ base: isSidebarOpen ? "translateX(0)" : "translateX(-100%)", md: "none" }}
          transition="transform 0.3s ease"
        >
          <Box
            p={4}
            borderBottomWidth="1px"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              Documentation
            </Text>
          </Box>
          
          {/* Add tabs for Files and Missing Translations */}
          <Box>
            <Tabs size="sm" variant="soft-rounded" colorScheme="blue" p={2}>
              <TabList>
                <Tab>Files</Tab>
                <Tab>Missing</Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
                  <Box flex={1} overflowY="auto" maxH="calc(100vh - 160px)">
                    {error ? (
                      <Text color="red.500">{error}</Text>
                    ) : (
                      <FileExplorer
                        files={files}
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile?.path}
                      />
                    )}
                  </Box>
                </TabPanel>
                <TabPanel p={0}>
                  <Box flex={1} overflowY="auto" maxH="calc(100vh - 160px)">
                    <MissingTranslations
                      onFileSelect={handleMissingTranslationSelect}
                      availableLanguages={AVAILABLE_LANGUAGES}
                    />
                  </Box>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </Box>
        </Box>

        {/* Overlay for mobile */}
        {isSidebarOpen && (
          <Box
            display={{ base: "block", md: "none" }}
            position="fixed"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="blackAlpha.600"
            zIndex={15}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Editor/Preview Area */}
        <VStack flex={1} spacing={0}>
          {selectedFile ? (
            <>
              <Toolbar
                onSave={handleSave}
                onViewModeChange={setViewMode}
                viewMode={viewMode}
                fileName={selectedFile.name}
                currentLanguage={currentLanguage}
                availableLanguages={availableLanguages}
                onLanguageChange={handleLanguageChange}
                filePath={selectedFile.path}
                editorInstance={editorInstance}
              />
              <Box flex={1} w="full" display="flex">
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <Box 
                    w={viewMode === 'split' ? '50%' : 'full'}
                    height="calc(100vh - 112px)"
                    overflowY="auto"
                  >
                    <Editor
                      height="100%"
                      language="markdown"
                      value={fileContent}
                      onChange={(value) => setFileContent(value || '')}
                      theme="vs-light"
                      onMount={handleEditorDidMount}
                      options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        lineHeight: 1.6,
                        padding: { top: 20 },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        suggestOnTriggerCharacters: true,
                      }}
                    />
                  </Box>
                )}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <Box 
                    w={viewMode === 'split' ? '50%' : 'full'}
                    height="calc(100vh - 112px)"
                    overflowY="auto"
                    borderLeftWidth={viewMode === 'split' ? '1px' : undefined}
                    borderColor="gray.200"
                  >
                    <Box p={8} maxW={viewMode === 'preview' ? '800px' : undefined} mx="auto">
                      <ReactMarkdown
                        components={ChakraUIRenderer(markdownTheme)}
                        remarkPlugins={[remarkGfm, remarkFrontmatter]}
                        skipHtml
                      >
                        {fileContent}
                      </ReactMarkdown>
                    </Box>
                  </Box>
                )}
              </Box>
            </>
          ) : (
            <Box 
              flex={1} 
              display="flex" 
              alignItems="center" 
              justifyContent="center"
              bg="gray.50"
            >
              <VStack spacing={3}>
                <Text color="gray.500">
                  Select a markdown file to start editing
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Your documentation will be previewed in real-time
                </Text>
              </VStack>
            </Box>
          )}
        </VStack>
      </HStack>

      {/* Status Bar */}
      <Box
        h="24px"
        bg="gray.100"
        borderTopWidth="1px"
        borderColor="gray.200"
        px={4}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
      >
        <Text fontSize="xs" color="gray.600">
          {selectedFile ? `${selectedFile.path} - Markdown` : 'Ready'}
          {selectedFile && currentLanguage !== contentLanguage && (
            <Text as="span" color="orange.500" ml={2}>
              (Viewing {languageMap[contentLanguage]} version - {languageMap[currentLanguage]} translation not available)
            </Text>
          )}
        </Text>
        <Text fontSize="xs" color="gray.600">
          {viewMode === 'preview' ? 'Preview Mode' : 'Edit Mode'}
        </Text>
      </Box>
    </Box>
  );
}

