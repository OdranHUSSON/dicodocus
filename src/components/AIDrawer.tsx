import React, { useState } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  VStack,
  Text,
  Textarea,
  useToast,
  ButtonGroup,
  Box,
  HStack,
} from '@chakra-ui/react';
import { editor } from 'monaco-editor';

interface AIDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedText: string;
  editorInstance: editor.IStandaloneCodeEditor | null;
}

export const AIDrawer: React.FC<AIDrawerProps> = ({
  isOpen,
  onClose,
  selectedText,
  editorInstance,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAIResponse] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const toast = useToast();

  React.useEffect(() => {
    if (isOpen) {
      setAIResponse('');
      setCustomPrompt('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleAIRequest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: selectedText ? 
            `Améliore ce texte: ${selectedText}` : 
            customPrompt
        }),
      });

      if (!response.ok) throw new Error('Erreur API');
      
      const data = await response.json();
      setAIResponse(data.response);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Échec de la requête AI',
        status: 'error',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (!editorInstance || !aiResponse) return;

    const selection = editorInstance.getSelection();
    const position = editorInstance.getPosition();
    const model = editorInstance.getModel();

    if (!model || !position) return;

    if (selection && !selection.isEmpty()) {
      // Mode sélection
      editorInstance.executeEdits('ai-edit', [{
        range: selection,
        text: aiResponse,
      }]);
    } else {
      // Mode insertion au curseur
      editorInstance.executeEdits('ai-edit', [{
        range: {
          startLineNumber: position.lineNumber,
          startColumn: position.column,
          endLineNumber: position.lineNumber,
          endColumn: position.column
        },
        text: aiResponse,
      }]);
    }
    onClose();
  };

  const handleNewRequest = () => {
    setAIResponse('');
    setCustomPrompt('');
    setIsLoading(false);
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} size="xl">
      <DrawerOverlay backgroundColor="rgba(0, 0, 0, 0.3)" backdropFilter="blur(20px)" />
      <DrawerContent 
        backgroundColor="rgba(255, 255, 255, 0.8)"
        backdropFilter="blur(40px) saturate(180%)"
        border="1px solid rgba(255, 255, 255, 0.3)"
      >
        <DrawerCloseButton 
          color="gray.700"
          bg="rgba(255, 255, 255, 0.5)"
          borderRadius="full"
          size="lg"
          p={6}
          _hover={{ 
            bg: "rgba(255, 255, 255, 0.8)",
            transform: "scale(1.05)",
          }}
          transition="all 0.2s"
          top={8}
          right={8}
        />
        <DrawerHeader 
          fontSize="3xl" 
          fontWeight="light"
          letterSpacing="-0.5px"
          color="gray.900"
          pt={8}
          pb={6}
          borderBottom="1px solid rgba(0, 0, 0, 0.1)"
        >
          Assistant IA
        </DrawerHeader>

        <DrawerBody p={8}>
          <VStack spacing={8} align="stretch">
            {selectedText ? (
              <Box>
                <Text 
                  fontSize="md" 
                  fontWeight="medium" 
                  color="gray.500" 
                  mb={4}
                  letterSpacing="-0.3px"
                >
                  Texte sélectionné
                </Text>
                <Box
                  p={6} 
                  bg="rgba(0, 0, 0, 0.03)"
                  borderRadius="2xl"
                  border="1px solid rgba(0, 0, 0, 0.06)"
                  fontSize="md"
                  color="gray.700"
                  lineHeight="tall"
                >
                  {selectedText}
                </Box>
              </Box>
            ) : (
              <Box>
                <Text 
                  fontSize="md" 
                  fontWeight="medium" 
                  color="gray.500" 
                  mb={4}
                  letterSpacing="-0.3px"
                >
                  Votre demande
                </Text>
                <Textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Saisissez votre demande..."
                  bg="rgba(0, 0, 0, 0.03)"
                  border="1px solid rgba(0, 0, 0, 0.06)"
                  borderRadius="2xl"
                  _focus={{
                    bg: "white",
                    borderColor: "blue.400",
                    boxShadow: "0 0 0 3px rgba(66, 153, 225, 0.15)"
                  }}
                  fontSize="md"
                  p={6}
                  minH="120px"
                  resize="none"
                />
              </Box>
            )}

            {!aiResponse && (
              <Button
                onClick={handleAIRequest}
                isLoading={isLoading}
                loadingText="Génération en cours..."
                bg="black"
                color="white"
                _hover={{ 
                  transform: "translateY(-1px)",
                  boxShadow: "lg"
                }}
                _active={{ 
                  transform: "translateY(0)",
                  bg: "gray.800"
                }}
                fontSize="md"
                fontWeight="medium"
                height="56px"
                borderRadius="full"
                px={8}
                transition="all 0.2s"
                isDisabled={!selectedText && !customPrompt}
              >
                Générer une suggestion
              </Button>
            )}

            {aiResponse && (
              <>
                <Box>
                  <Text 
                    fontSize="md" 
                    fontWeight="medium" 
                    color="gray.500" 
                    mb={4}
                    letterSpacing="-0.3px"
                  >
                    Suggestion
                  </Text>
                  <Box
                    p={6} 
                    bg="rgba(66, 153, 225, 0.04)"
                    borderRadius="2xl"
                    border="1px solid rgba(66, 153, 225, 0.2)"
                    fontSize="md"
                    color="gray.700"
                    lineHeight="tall"
                  >
                    {aiResponse}
                  </Box>
                </Box>

                <HStack spacing={4} justify="flex-end" pt={4}>
                  <Button
                    onClick={handleNewRequest}
                    fontSize="md"
                    fontWeight="medium"
                    height="56px"
                    variant="ghost"
                    borderRadius="full"
                    px={8}
                    color="gray.600"
                    _hover={{ bg: "gray.50" }}
                  >
                    Nouvelle requête
                  </Button>
                  <Button
                    onClick={onClose}
                    fontSize="md"
                    fontWeight="medium"
                    height="56px"
                    variant="ghost"
                    borderRadius="full"
                    px={8}
                    color="gray.600"
                    _hover={{ bg: "gray.50" }}
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleAccept}
                    bg="black"
                    color="white"
                    _hover={{ 
                      transform: "translateY(-1px)",
                      boxShadow: "lg"
                    }}
                    _active={{ 
                      transform: "translateY(0)",
                      bg: "gray.800"
                    }}
                    fontSize="md"
                    fontWeight="medium"
                    height="56px"
                    borderRadius="full"
                    px={8}
                    transition="all 0.2s"
                  >
                    Accepter
                  </Button>
                </HStack>
              </>
            )}
          </VStack>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};