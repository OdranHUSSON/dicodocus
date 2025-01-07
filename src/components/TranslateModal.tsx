import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Checkbox,
  VStack,
  Text,
  useToast,
  Progress,
} from '@chakra-ui/react';

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableLanguages: { code: string; name: string }[];
  currentLanguage: string;
  filePath: string;
  contentType: 'docs' | 'blog' | 'pages';
}

export const TranslateModal: React.FC<TranslateModalProps> = ({
  isOpen,
  onClose,
  availableLanguages,
  currentLanguage,
  filePath,
  contentType,
}) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    availableLanguages.map(lang => lang.code).filter(code => code !== currentLanguage)
  );
  const [isTranslating, setIsTranslating] = useState(false);
  const toast = useToast();

  const handleTranslate = async () => {
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

      toast({
        title: 'Translation complete',
        status: 'success',
        duration: 3000,
      });
      onClose();
    } catch (error) {
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Translate Document</ModalHeader>
        <ModalBody>
          <Text mb={4}>
            Translating from: <strong>{availableLanguages.find(lang => lang.code === currentLanguage)?.name}</strong>
          </Text>
          <Text mb={2}>Select target languages:</Text>
          <VStack align="start" spacing={2}>
            {availableLanguages
              .filter(lang => lang.code !== currentLanguage)
              .map(lang => (
                <Checkbox
                  key={lang.code}
                  isChecked={selectedLanguages.includes(lang.code)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedLanguages([...selectedLanguages, lang.code]);
                    } else {
                      setSelectedLanguages(selectedLanguages.filter(code => code !== lang.code));
                    }
                  }}
                >
                  {lang.name}
                </Checkbox>
              ))}
          </VStack>
          {isTranslating && <Progress size="xs" isIndeterminate mt={4} />}
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleTranslate}
            isLoading={isTranslating}
            isDisabled={selectedLanguages.length === 0}
          >
            Translate
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};