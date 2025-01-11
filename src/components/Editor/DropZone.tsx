import React, { useRef } from 'react';
import { Box, VStack, Text } from '@chakra-ui/react';
import { useDrop, useDrag } from 'react-dnd';

interface DropZoneProps {
  components: any[];
  onDrop: (item: any) => void;
  onComponentSelect: (component: any) => void;
  onMoveComponent: (dragIndex: number, hoverIndex: number) => void;
  dragRefs: React.RefObject<any>[];
  onDragStateChange: (isDragging: boolean) => void;
}

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export function DropZone({ components, onDrop, onComponentSelect, onMoveComponent, dragRefs, onDragStateChange }: DropZoneProps) {
  const ref = useRef<HTMLDivElement>(null);
  
  const [{ isOver }, drop] = useDrop({
    accept: 'COMPONENT',
    drop: (item: any) => onDrop(item),
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
    hover(item: any, monitor) {
      if (!ref.current) {
        return;
      }

      const dragIndex = item.index;
      const hoverIndex = components.length;

      // Don't replace items with themselves
      if (dragIndex === hoverIndex) {
        return;
      }

      onMoveComponent(dragIndex, hoverIndex);
      item.index = hoverIndex;
    }
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
          {components.map((component, index) => {
            const [{ isDragging }, drag] = useDrag<DragItem, unknown, { isDragging: boolean }>({
              type: 'COMPONENT',
              item: { ...component, index },
              collect: (monitor) => {
                const isDragging = monitor.isDragging();
                if (isDragging !== monitor.isDragging()) {
                  onDragStateChange(isDragging);
                }
                return {
                  isDragging
                };
              }
            });

            return (
              <Box
                key={component.instanceId}
                ref={(node) => {
                  // Use a MutableRefObject instead of RefObject
                  (dragRefs[index] as any).current = node;
                  if (drag) {
                    (drag as any)(node);
                  }
                }}
                p={4}
                bg="white"
                borderRadius="md"
                boxShadow="sm"
                onClick={() => onComponentSelect(component)}
                cursor="pointer"
                opacity={isDragging ? 0.5 : 1}
                _hover={{ boxShadow: 'md' }}
              >
                <Text>{component.name}</Text>
              </Box>
            );
          })}
        </VStack>
      )}
    </Box>
  );
}