import React, { useRef } from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import { useDrop } from 'react-dnd';

interface DropZoneProps {
  components: any[];
  onDrop: (item: any) => void;
  onComponentSelect: (component: any) => void;
}

export function DropZone({ components, onDrop, onComponentSelect }: DropZoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop({
    accept: 'COMPONENT',
    drop: (item: any) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // Apply the drop ref to our element
  drop(ref);

  return (
    <Box
      ref={ref}
      h="100%"
      p={4}
      bg={isOver ? 'blue.50' : 'transparent'}
      transition="background-color 0.2s"
    >
      {components.length === 0 ? (
        <Box
          h="100%"
          display="flex"
          alignItems="center"
          justifyContent="center"
          border="2px dashed"
          borderColor="gray.200"
          borderRadius="md"
        >
          <Text color="gray.500">Drag components here</Text>
        </Box>
      ) : (
        <VStack spacing={4} align="stretch">
          {components.map((component) => (
            <Box
              key={component.id}
              p={4}
              bg="white"
              borderRadius="md"
              boxShadow="sm"
              onClick={() => onComponentSelect(component)}
              cursor="pointer"
              _hover={{ boxShadow: 'md' }}
            >
              <Text>{component.name}</Text>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}