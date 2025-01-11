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

  // Load components from content
  React.useEffect(() => {
    console.log('Raw content received:', content);

    if (!content) {
      console.log('No content to parse');
      return;
    }

    try {
      // Split content into lines and look for JSON data
      const lines = content.split('\n');
      const loadedComponents: ComponentInstance[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Look for our component data markers
        if (line.includes('<!-- COMPONENT_DATA:')) {
          try {
            // Extract JSON between markers
            const jsonStr = line.replace('<!-- COMPONENT_DATA:', '').replace('-->', '').trim();
            console.log('Found component data:', jsonStr);
            
            const componentData = JSON.parse(jsonStr);
            if (componentData.instanceId && componentData.id && componentData.props) {
              loadedComponents.push(componentData);
              console.log('Successfully parsed component:', componentData);
            }
          } catch (e) {
            console.error('Failed to parse component line:', line, e);
          }
        }
      }

      console.log('Total components loaded:', loadedComponents.length);
      setComponents(loadedComponents);
      
    } catch (error) {
      console.error('Error parsing content:', error);
    }
  }, [content]);

  // Generate code with embedded component data
  React.useEffect(() => {
    if (components.length === 0) {
      console.log('No components to generate code for');
      return;
    }

    try {
      const componentMarkers = components.map(comp => {
        const jsonStr = JSON.stringify(comp);
        return `<!-- COMPONENT_DATA:${jsonStr}-->`;
      });

      const generatedCode = `
${componentMarkers.join('\n')}
${generatePageCode({ components })}
      `.trim();

      console.log('Generated code with components:', components.length);
      onChange(generatedCode);
    } catch (error) {
      console.error('Error generating code:', error);
    }
  }, [components, onChange]);

  // Fetch available components
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
    const newComponent: ComponentInstance = {
      ...item,
      instanceId: `${item.id}_${Date.now()}`,
      props: Object.entries(item.propConfigs).reduce((acc, [key, config]) => {
        acc[key] = config.default;
        return acc;
      }, {} as Record<string, any>),
    };
    
    console.log('Adding new component:', newComponent);
    setComponents(prev => [...prev, newComponent]);
  };

  const handleComponentSelect = (component: ComponentInstance) => {
    setSelectedComponent(component);
  };

  const handlePropertyChange = (componentId: string, propName: string, value: any) => {
    setComponents(prev =>
      prev.map(comp =>
        comp.instanceId === componentId
          ? { ...comp, props: { ...comp.props, [propName]: value } }
          : comp
      )
    );
    
    if (selectedComponent?.instanceId === componentId) {
      setSelectedComponent(prev => 
        prev ? { ...prev, props: { ...prev.props, [propName]: value } } : null
      );
    }
  };

  const handleSave = React.useCallback(() => {
    const generatedCode = generatePageCode({ components });
    onSave(generatedCode);
  }, [components, onSave]);

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