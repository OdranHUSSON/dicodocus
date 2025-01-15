"use client";

import { FileExplorer, FileItem } from "@/components/FileExplorer";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { MissingTranslations } from "@/components/MissingTranslations";
import { Toolbar } from "@/components/Toolbar";
import { CloseIcon, HamburgerIcon, RepeatIcon } from "@chakra-ui/icons";
import {
  Box,
  HStack,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useToast,
  VStack,
} from "@chakra-ui/react";
import ChakraUIRenderer, { defaults } from "chakra-ui-markdown-renderer";
import * as monaco from "monaco-editor";
import { editor } from "monaco-editor";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkFrontmatter from "remark-frontmatter";
import { v4 as uuidv4 } from "uuid";

type ViewMode = "edit" | "preview" | "split";

interface Language {
  code: string;
  name: string;
}

// Add error type for toast description
type ToastError = Error | { message: string };

// Add these constants at the top of the file
const STORAGE_KEYS = {
  SELECTED_FILE: "docs-editor-selected-file",
  VIEW_MODE: "docs-editor-view-mode",
  CURRENT_LANGUAGE: "docs-editor-language",
  SIDEBAR_STATE: "docs-editor-sidebar-state",
};

const AVAILABLE_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "lu", name: "Luxembourgish" },
];

// Add these image types at the top with your other constants
const SUPPORTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "image/bmp",
];

export default function HomePage() {
  const [files, setFiles] = useState<{
    docs: FileItem[];
    blog: FileItem[];
    pages: FileItem[];
  }>({ docs: [], blog: [], pages: [] });
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [currentLanguage, setCurrentLanguage] = useState("");
  const [availableLanguages, setAvailableLanguages] = useState<Language[]>([]);
  const [contentLanguage, setContentLanguage] = useState<string>("en");
  const toast = useToast();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [editorInstance, setEditorInstance] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function fetchFiles() {
    try {
      const response = await fetch("/api/files");
      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }
      const data = await response.json();
      setFiles(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  }

  const languageMap: Record<string, string> = {
    en: "English",
    fr: "Français",
    de: "Deutsch",
    lu: "Lëtzebuergesch",
  };

  useEffect(() => {
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
    const savedViewMode = localStorage.getItem(
      STORAGE_KEYS.VIEW_MODE
    ) as ViewMode;
    if (savedViewMode) {
      setViewMode(savedViewMode);
    }

    // Load sidebar state
    const savedSidebarState = localStorage.getItem(STORAGE_KEYS.SIDEBAR_STATE);
    if (savedSidebarState !== null) {
      setSidebarOpen(savedSidebarState === "true");
    }

    // Load saved file
    const savedFile = localStorage.getItem(STORAGE_KEYS.SELECTED_FILE);
    if (savedFile) {
      try {
        const fileData = JSON.parse(savedFile);
        handleFileSelect(fileData);
      } catch (error) {
        console.error("Error loading saved file:", error);
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
      localStorage.setItem(
        STORAGE_KEYS.SELECTED_FILE,
        JSON.stringify(selectedFile)
      );
    }
  }, [selectedFile]);

  const handleFileSelect = async (file: FileItem | null) => {
    if (!isInitialized) return;

    if (!file) {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_FILE);
      setSelectedFile(null);
      setFileContent("");
      return;
    }

    if (file.type === "file") {
      try {
        const response = await fetch(
          `/api/files/content?path=${encodeURIComponent(
            file.path
          )}&lang=${currentLanguage}&contentType=${file.contentType}`
        );

        if (!response.ok) throw new Error("Failed to fetch file content");

        const data = await response.json();
        setFileContent(data.content);
        setContentLanguage(data.language);
        setAvailableLanguages(
          data.availableLanguages.map((code: string) => ({
            code,
            name: languageMap[code] || code,
          }))
        );

        // Update state atomically after everything is fetched
        setSelectedFile(file);
      } catch (err) {
        toast({
          title: "Error loading file",
          description: (err as ToastError).message,
          status: "error",
          duration: 3000,
        });
      }
    }
  };

  // Updated handleSave to validate selected file
  const handleSave = async (contentToSave?: string) => {
    if (!selectedFile) return;

    const finalContent = contentToSave ?? fileContent;
    const filePath = selectedFile.path; // Snapshot of selected file path

    try {
      const response = await fetch("/api/files/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: filePath, // Ensure this references the correct file
          content: finalContent,
          language: currentLanguage,
          contentType: selectedFile.contentType,
        }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Failed to save file" }));
        throw new Error(errorData.message || "Failed to save file");
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
        title: "Success",
        description: `File "${selectedFile.name}" saved successfully`,
        status: "success",
        duration: 3000,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "An unknown error occurred while saving";
      console.error("Save error:", errorMessage);
      toast({
        title: "Error saving file",
        description: errorMessage,
        status: "error",
        duration: 3000,
      });
    }
  };

  // Ensure editor updates are consistent
  useEffect(() => {
    if (editorInstance) {
      editorInstance.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          const currentContent = editorInstance.getValue();
          handleSave(currentContent);
        }
      );
    }
  }, [selectedFile, editorInstance]);

  const handleLanguageChange = async (lang: string) => {
    if (!selectedFile) return;

    try {
      const response = await fetch(
        `/api/files/content?path=${encodeURIComponent(
          selectedFile.path
        )}&lang=${lang}&contentType=${selectedFile.contentType}`
      );

      if (!response.ok) throw new Error("Failed to fetch translation");

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
        title: "Language switch failed",
        description: (err as ToastError).message,
        status: "error",
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
    img: (props: any) => {
      const { src, alt } = props;
      const imageSrc = src.startsWith("http")
        ? src
        : `${process.env.NEXT_PUBLIC_DOCUSAURUS_URL}${src}`;
      return <img src={imageSrc} alt={alt} style={{ maxWidth: "100%" }} />;
    },
    table: (props: any) => {
      return (
        <Box overflowX="auto" my={4}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            {props.children}
          </table>
        </Box>
      );
    },
    th: (props: any) => (
      <th
        style={{
          borderWidth: "1px",
          borderColor: "inherit",
          padding: "0.5rem",
          backgroundColor: "gray.50",
        }}
      >
        {props.children}
      </th>
    ),
    td: (props: any) => (
      <td
        style={{
          borderWidth: "1px",
          borderColor: "inherit",
          padding: "0.5rem",
        }}
      >
        {props.children}
      </td>
    ),
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
        const imageType = item.types.find((type) =>
          SUPPORTED_IMAGE_TYPES.includes(type)
        );

        if (imageType) {
          hasHandledImage = true;
          const blob = await item.getType(imageType);
          const fileExtension = imageType.split("/")[1];
          const uuid = uuidv4();
          const fileName = `${uuid}.${fileExtension}`;

          // Create form data with additional metadata
          const formData = new FormData();
          formData.append(
            "file",
            new File([blob], fileName, { type: imageType })
          );
          formData.append("description", "Pasted image"); // Default description

          const response = await fetch("/api/media", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Upload failed");
          }

          const data = await response.json();

          // Insert markdown at current selection or cursor position
          const selection = editor.getSelection();
          const imageMarkdown = `![${data.name}](${data.path})`;

          if (selection) {
            editor.executeEdits("", [
              {
                range: selection,
                text: imageMarkdown,
              },
            ]);
          } else {
            const position = editor.getPosition();
            if (position) {
              editor.executeEdits("", [
                {
                  range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                  },
                  text: imageMarkdown,
                },
              ]);
            }
          }

          toast({
            title: "Image uploaded successfully",
            description: `Saved as ${data.name}`,
            status: "success",
            duration: 3000,
          });
          break;
        }
      }

      if (!hasHandledImage) {
        return true; // Allow default paste behavior
      }
      return false; // Prevent default paste behavior
    } catch (error) {
      console.error("Paste error:", error);
      toast({
        title: "Upload failed",
        description:
          error instanceof Error ? error.message : "Failed to upload image",
        status: "error",
        duration: 3000,
      });
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
    console.error("Error:", error);
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
  const handleMissingTranslationSelect = async (
    filePath: string,
    contentType: "docs" | "blog"
  ) => {
    const findFile = (items: FileItem[]): FileItem | null => {
      for (const item of items) {
        if (item.path === filePath && item.contentType === contentType)
          return item;
        if (item.children) {
          const found = findFile(item.children);
          if (found) return found;
        }
      }
      return null;
    };

    const file = findFile(contentType === "docs" ? files.docs : files.blog);
    if (file) {
      await handleFileSelect(file);
    }
  };

  // Add this effect to update the save command when language changes
  useEffect(() => {
    if (editorInstance) {
      editorInstance.addCommand(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
        () => {
          const currentContent = editorInstance.getValue();
          handleSave(currentContent);
        }
      );
    }
  }, [currentLanguage, editorInstance]);

  const refreshFiles = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/files");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.details || "Failed to fetch files");
      }
      const data = await response.json();
      setFiles(data);
      setError(null); // Clear any existing errors
      toast({
        title: "Files refreshed",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(errorMessage);
      toast({
        title: "Error refreshing files",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRefreshing(false);
    }
  };

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
          transform={{
            base: isSidebarOpen ? "translateX(0)" : "translateX(-100%)",
            md: "none",
          }}
          transition="transform 0.3s ease"
        >
          <Box
            p={4}
            borderBottomWidth="1px"
            borderColor="gray.200"
            bg="gray.50"
          >
            <Text fontSize="sm" fontWeight="semibold" color="gray.700">
              Documentation & Blog
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
                    <HStack p={2} justify="space-between">
                      <Text fontSize="sm" color="gray.600">
                        Files
                      </Text>
                      <IconButton
                        icon={<RepeatIcon />}
                        size="sm"
                        variant="ghost"
                        aria-label="Refresh files"
                        onClick={refreshFiles}
                        isLoading={isRefreshing}
                        disabled={isRefreshing}
                      />
                    </HStack>
                    {error ? (
                      <Text color="red.500">{error}</Text>
                    ) : (
                      <FileExplorer
                        files={files}
                        onFileSelect={handleFileSelect}
                        selectedFile={selectedFile?.path}
                        onRefresh={fetchFiles}
                      />
                    )}
                  </Box>
                </TabPanel>
                <TabPanel p={0}>
                  <Box flex={1} overflowY="auto" maxH="calc(100vh - 160px)">
                    <MissingTranslations
                      onFileSelect={handleMissingTranslationSelect}
                      availableLanguages={AVAILABLE_LANGUAGES}
                      contentType="docs"
                    />
                    <MissingTranslations
                      onFileSelect={handleMissingTranslationSelect}
                      availableLanguages={AVAILABLE_LANGUAGES}
                      contentType="blog"
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
                contentType={selectedFile.contentType}
                files={files}
                setFiles={setFiles}
              />
              <Box flex={1} w="full" display="flex">
                {(viewMode === "edit" || viewMode === "split") && (
                  <MarkdownEditor
                    content={fileContent}
                    onChange={setFileContent}
                    onSave={handleSave}
                    viewMode={viewMode}
                    onEditorMount={handleEditorDidMount}
                  />
                )}
                {(viewMode === "preview" || viewMode === "split") && (
                  <Box
                    w={viewMode === "split" ? "50%" : "full"}
                    height="calc(100vh - 112px)"
                    overflowY="auto"
                    borderLeftWidth={viewMode === "split" ? "1px" : undefined}
                    borderColor="gray.200"
                  >
                    <Box
                      p={8}
                      maxW={viewMode === "preview" ? "800px" : undefined}
                      mx="auto"
                      height="100%"
                    >
                      {selectedFile?.contentType &&
                        (currentLanguage ===
                        process.env.NEXT_PUBLIC_DOCUSAURUS_DEFAULT_LANG ? (
                          <iframe
                            src={`${process.env.NEXT_PUBLIC_DOCUSAURUS_URL}/${
                              selectedFile.contentType
                            }/${selectedFile.path.replace(".md", "")}`}
                            style={{
                              width: "100%",
                              height: "calc(100vh - 160px)", // Account for padding and toolbar
                              border: "none",
                              display: "block", // Prevent inline spacing issues
                            }}
                          />
                        ) : (
                          <ReactMarkdown
                            components={ChakraUIRenderer(markdownTheme)}
                            remarkPlugins={[remarkFrontmatter]}
                            skipHtml
                          >
                            {fileContent}
                          </ReactMarkdown>
                        ))}
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
          {selectedFile
            ? `${selectedFile.path} - ${
                selectedFile.contentType === "docs" ? "Documentation" : "Blog"
              }`
            : "Ready"}
          {selectedFile && currentLanguage !== contentLanguage && (
            <Text as="span" color="orange.500" ml={2}>
              (Viewing {languageMap[contentLanguage]} version -{" "}
              {languageMap[currentLanguage]} translation not available)
            </Text>
          )}
        </Text>
        <Text fontSize="xs" color="gray.600">
          {viewMode === "preview" ? "Preview Mode" : "Edit Mode"}
        </Text>
      </Box>
    </Box>
  );
}
