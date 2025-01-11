import React, { useRef } from 'react';
import { Box, VStack, Text, useColorModeValue, Spinner } from '@chakra-ui/react';
import { useDrag } from 'react-dnd';
import type { Identifier } from 'dnd-core';
import { ComponentTemplate } from '@/types/components';

interface ComponentItemProps {
  component: any;
}

function ComponentItem({ component }: ComponentItemProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isDragging }, drag] = useDrag({
    type: 'COMPONENT',
    item: component,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  // Apply the drag ref to our element
  drag(ref);

  return (
    <Box
      ref={ref}
      p={3}
      bg={useColorModeValue('white', 'gray.700')}
      borderRadius="md"
      boxShadow="sm"
      cursor="move"
      opacity={isDragging ? 0.5 : 1}
      _hover={{ bg: useColorModeValue('gray.50', 'gray.600') }}
    >
      <Text fontSize="sm">{component.name}</Text>
    </Box>
  );
}

interface ComponentPaletteProps {
  components: ComponentTemplate[];
  isLoading: boolean;
}

export function ComponentPalette({ components, isLoading }: ComponentPaletteProps) {
  return (
    <Box
      w="250px"
      h="100%"
      borderRightWidth={1}
      borderColor="gray.200"
      bg={useColorModeValue('gray.50', 'gray.800')}
      p={4}
      overflowY="auto"
    >
      <Text fontWeight="bold" mb={4}>
        Components
      </Text>
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <Spinner />
        </Box>
      ) : components.length === 0 ? (
        <Text color="gray.500">No components found</Text>
      ) : (
        <VStack spacing={2} align="stretch">
          {components.map((component) => (
            <ComponentItem key={component.id} component={component} />
          ))}
        </VStack>
      )}
    </Box>
  );
}