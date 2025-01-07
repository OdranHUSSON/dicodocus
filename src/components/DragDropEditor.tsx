import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, HStack, VStack } from '@chakra-ui/react';
import { ComponentPalette } from './Editor/ComponentPalette';
import { DropZone } from './Editor/DropZone';
import { PropertiesPanel } from './Editor/PropertiesPanel';

// Mock data for components (will be fetched from API later)
const MOCK_COMPONENTS = [
  {
    id: 'hero',
    name: 'Hero',
    category: 'Layout',
    props: {
      title: { type: 'string', default: 'Welcome' },
      description: { type: 'string', default: 'This is a hero section' },
      buttonText: { type: 'string', default: 'Learn More' },
    },
  },
  {
    id: 'features',
    name: 'Features',
    category: 'Content',
    props: {
      items: {
        type: 'array',
        default: [
          { title: 'Feature 1', description: 'Description 1' },
          { title: 'Feature 2', description: 'Description 2' },
        ],
      },
    },
  },
  // Add more mock components as needed
];

interface DragDropEditorProps {
  content: string;
  onChange: (value: string) => void;
  onSave: (content: string) => void;
}

export function DragDropEditor({ content, onChange, onSave }: DragDropEditorProps) {
  const [components, setComponents] = React.useState<any[]>([]);
  const [selectedComponent, setSelectedComponent] = React.useState<any>(null);

  const handleDrop = (item: any) => {
    setComponents((prev) => [...prev, { ...item, id: `${item.id}_${Date.now()}` }]);
  };

  const handleComponentSelect = (component: any) => {
    setSelectedComponent(component);
  };

  const handlePropertyChange = (componentId: string, propName: string, value: any) => {
    setComponents((prev) =>
      prev.map((comp) =>
        comp.id === componentId
          ? { ...comp, props: { ...comp.props, [propName]: value } }
          : comp
      )
    );
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <HStack h="100%" spacing={0} align="stretch">
        {/* Component Palette */}
        <ComponentPalette components={MOCK_COMPONENTS} />

        {/* Drop Zone */}
        <Box flex={1} h="100%" overflowY="auto" bg="gray.50">
          <DropZone
            components={components}
            onDrop={handleDrop}
            onComponentSelect={handleComponentSelect}
          />
        </Box>

        {/* Properties Panel */}
        <PropertiesPanel
          component={selectedComponent}
          onPropertyChange={handlePropertyChange}
        />
      </HStack>
    </DndProvider>
  );
}