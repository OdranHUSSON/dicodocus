import React from 'react';
import { Box, VStack, Text, Input, FormControl, FormLabel } from '@chakra-ui/react';

interface PropertiesPanelProps {
  component: any;
  onPropertyChange: (componentId: string, propName: string, value: any) => void;
}

export function PropertiesPanel({ component, onPropertyChange }: PropertiesPanelProps) {
  if (!component) {
    return (
      <Box w="300px" p={4} borderLeftWidth={1} borderColor="gray.200">
        <Text color="gray.500">Select a component to edit properties</Text>
      </Box>
    );
  }

  return (
    <Box w="300px" p={4} borderLeftWidth={1} borderColor="gray.200">
      <Text fontWeight="bold" mb={4}>
        {component.name} Properties
      </Text>
      <VStack spacing={4} align="stretch">
        {Object.entries(component.props).map(([propName, propConfig]: [string, any]) => (
          <FormControl key={propName}>
            <FormLabel fontSize="sm">{propName}</FormLabel>
            <Input
              size="sm"
              value={component.props[propName]}
              onChange={(e) =>
                onPropertyChange(component.id, propName, e.target.value)
              }
            />
          </FormControl>
        ))}
      </VStack>
    </Box>
  );
}