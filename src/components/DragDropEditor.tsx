import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, HStack, VStack } from '@chakra-ui/react';
import { ComponentPalette } from './Editor/ComponentPalette';
import { DropZone } from './Editor/DropZone';
import { PropertiesPanel } from './Editor/PropertiesPanel';
import { ComponentInstance, ComponentTemplate } from '@/types/components';
import { generatePageCode } from '@/app/lib/codeGenerator';

interface DragDropEditorProps {
  content: string;
  onChange: (value: string) => void;
  onSave: (content: string) => void;
}

export function DragDropEditor({ content, onChange, onSave }: DragDropEditorProps) {
  const [components, setComponents] = React.useState<ComponentInstance[]>([]);
  const [availableComponents, setAvailableComponents] = React.useState<ComponentTemplate[]>([]);
  const [selectedComponent, setSelectedComponent] = React.useState<ComponentInstance | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Add this effect to update content when components change
  React.useEffect(() => {
    const generatedCode = generatePageCode({ components });
    onChange(generatedCode);
  }, [components, onChange]);

  // Fetch available components on mount
  React.useEffect(() => {
    const fetchComponents = async () => {
      try {
        const response = await fetch('/api/components');
        const data = await response.json();
        
        if (data.components) {
          setAvailableComponents(data.components);
        }
      } catch (error) {
        console.error('Error fetching components:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchComponents();
  }, []);

  const handleDrop = (item: ComponentTemplate) => {
    // Create a new instance of the component with default props
    const newComponent: ComponentInstance = {
      ...item,
      instanceId: `${item.id}_${Date.now()}`,
      props: Object.entries(item.propConfigs).reduce((acc, [key, config]) => {
        acc[key] = config.default;
        return acc;
      }, {} as Record<string, any>),
    };
    
    setComponents((prev) => [...prev, newComponent]);
  };

  const handleComponentSelect = (component: ComponentInstance) => {
    setSelectedComponent(component);
  };

  const handlePropertyChange = (componentId: string, propName: string, value: any) => {
    setComponents((prev) =>
      prev.map((comp) =>
        comp.instanceId === componentId
          ? { ...comp, props: { ...comp.props, [propName]: value } }
          : comp
      )
    );
    
    // Update selected component if it's the one being modified
    if (selectedComponent?.instanceId === componentId) {
      setSelectedComponent((prev) => 
        prev ? { ...prev, props: { ...prev.props, [propName]: value } } : null
      );
    }
  };

  // Add save handler
  const handleSave = React.useCallback(() => {
    const generatedCode = generatePageCode({ components });
    onSave(generatedCode);
  }, [components, onSave]);

  // Add keyboard shortcut for saving
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault();
        handleSave();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSave]);

  return (
    <DndProvider backend={HTML5Backend}>
      <HStack h="100%" spacing={0} align="stretch">
        <ComponentPalette 
          components={availableComponents} 
          isLoading={isLoading}
        />
        <Box flex={1} h="100%" overflowY="auto" bg="gray.50">
          <DropZone
            components={components}
            onDrop={handleDrop}
            onComponentSelect={handleComponentSelect}
          />
        </Box>
        <PropertiesPanel
          component={selectedComponent}
          onPropertyChange={handlePropertyChange}
        />
      </HStack>
    </DndProvider>
  );
}