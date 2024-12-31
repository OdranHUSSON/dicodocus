import React from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  HStack,
  Text,
} from '@chakra-ui/react';
import { FiGlobe, FiChevronDown } from 'react-icons/fi';

interface Language {
  code: string;
  name: string;
}

interface LanguageSelectorProps {
  currentLanguage: string;
  availableLanguages: Language[];
  onLanguageChange: (lang: string) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  availableLanguages,
  onLanguageChange,
}) => {
  const currentLang = availableLanguages.find(lang => lang.code === currentLanguage);

  return (
    <Menu>
      <MenuButton
        as={Button}
        size="sm"
        variant="ghost"
        rightIcon={<FiChevronDown />}
        leftIcon={<FiGlobe />}
      >
        <HStack spacing={2}>
          <Text>{currentLang?.name || 'Select Language'}</Text>
        </HStack>
      </MenuButton>
      <MenuList>
        {availableLanguages.map((lang) => (
          <MenuItem
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            fontWeight={currentLanguage === lang.code ? 'bold' : 'normal'}
          >
            {lang.name}
          </MenuItem>
        ))}
      </MenuList>
    </Menu>
  );
};