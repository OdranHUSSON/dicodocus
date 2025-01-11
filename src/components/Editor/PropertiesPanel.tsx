import React from 'react';
import { Box, VStack, Text, Input, FormControl, FormLabel } from '@chakra-ui/react';

interface PropConfig {
  type: string;
  default: any;
}

interface ComponentInstance {
  instanceId: string;
  id: string;
  name: string;
  propConfigs: {
    [key: string]: PropConfig;
  };
  props: {
    [key: string]: any;
  };
}

interface PropertiesPanelProps {
  component: ComponentInstance | null;
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
        {Object.entries(component.propConfigs).map(([propName, propConfig]) => {
          const currentValue = component.props[propName] ?? propConfig.default;

          return (
            <FormControl key={propName}>
              <FormLabel fontSize="sm">{propName}</FormLabel>
              <Input
                size="sm"
                value={currentValue}
                onChange={(e) =>
                  onPropertyChange(component.instanceId, propName, e.target.value)
                }
              />
            </FormControl>
          );
        })}
      </VStack>
    </Box>
  );
}