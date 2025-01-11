import React, { useState } from 'react';
import {
  useToast,
  Progress,
  Menu,
  MenuButton,
  MenuList,
  MenuItemOption,
  MenuOptionGroup,
  Button,
} from '@chakra-ui/react';

interface TranslateMenuProps {
  availableLanguages: { code: string; name: string }[];
  currentLanguage: string;
  filePath: string;
  contentType: 'docs' | 'blog' | 'pages';
}

export const TranslateMenu: React.FC<TranslateMenuProps> = ({
  availableLanguages,
  currentLanguage,
  filePath,
  contentType,
}) => {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const toast = useToast();

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

  return (
    <Menu closeOnSelect={false}>
      <MenuButton as={Button} isLoading={isTranslating}>
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
  );
};