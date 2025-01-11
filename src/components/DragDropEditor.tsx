import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Box, HStack, useColorModeValue, Container } from '@chakra-ui/react';
import { ComponentPalette } from './Editor/ComponentPalette';
import { DropZone } from './Editor/DropZone';
import { PropertiesPanel } from './Editor/PropertiesPanel';
import { ComponentInstance, ComponentTemplate } from '@/types/components';
import { generatePageCode } from '@/app/lib/codeGenerator';
import { motion, AnimatePresence } from 'framer-motion';

interface DragDropEditorProps {
  content: string;
  onChange: (value: string) => void;
  onSave: (content: string) => void;
}

export function DragDropEditor({ content, onChange, onSave }: DragDropEditorProps) {
  const [components, setComponents] = React.useState<ComponentInstance[]>([]);
  const componentsRef = React.useRef<ComponentInstance[]>([]);
  const [availableComponents, setAvailableComponents] = React.useState<ComponentTemplate[]>([]);
  const [selectedComponent, setSelectedComponent] = React.useState<ComponentInstance | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [lastContent, setLastContent] = React.useState(content);
  const [isDragging, setIsDragging] = React.useState(false);

  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Load components from content only when content changes
  React.useEffect(() => {
    if (!content || content === lastContent) return;

    try {
      const componentDataRegex = /<!-- COMPONENT_DATA:(.*?)-->/g;
      let match;
      const loadedComponents: ComponentInstance[] = [];

      while ((match = componentDataRegex.exec(content)) !== null) {
        try {
          const componentData = JSON.parse(match[1].trim());
          if (componentData.instanceId && componentData.id && componentData.props) {
            loadedComponents.push(componentData);
          }
        } catch (e) {
          console.error('Failed to parse component:', e);
        }
      }

      if (loadedComponents.length > 0) {
        componentsRef.current = loadedComponents;
        setComponents(loadedComponents);
      }
      setLastContent(content);
    } catch (error) {
      console.error('Error parsing content:', error);
    }
  }, [content, lastContent]);

  // Generate code only when components change
  const generateAndUpdateCode = React.useCallback(() => {
    if (componentsRef.current.length === 0) return;

    try {
      const safeComponents = componentsRef.current.map(comp => ({
        component: JSON.parse(JSON.stringify(comp)),
        marker: `<!-- COMPONENT_DATA:${JSON.stringify(comp)}-->`
      }));

      const generatedCode = generatePageCode({
        components: safeComponents.map(item => item.component)
      });

      const updatedContent = `${safeComponents.map(item => item.marker).join('\n')}\n${generatedCode}`;
      if (updatedContent !== content) {
        onChange(updatedContent);
      }
    } catch (error) {
      console.error('Error generating code:', error);
    }
  }, [onChange, content]);

  React.useEffect(() => {
    const controller = new AbortController();

    fetch('/api/components', { signal: controller.signal })
      .then(res => res.json())
      .then(data => {
        if (data.components) {
          setAvailableComponents(data.components);
        }
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('Error fetching components:', err);
        }
      })
      .finally(() => setIsLoading(false));

    return () => controller.abort();
  }, []);

  const handleDrop = React.useCallback((item: ComponentTemplate) => {
    setIsDragging(false);
    const newComponent: ComponentInstance = {
      ...item,
      instanceId: `${item.id}_${Date.now()}`,
      props: item.propConfigs ? Object.entries(item.propConfigs).reduce((acc, [key, config]) => {
        acc[key] = config.default ?? '';
        return acc;
      }, {} as Record<string, any>) : {},
    };
    
    setComponents(prev => {
      const updated = [...prev, newComponent];
      componentsRef.current = updated;
      return updated;
    });
    
    generateAndUpdateCode();
  }, [generateAndUpdateCode]);

  const handleComponentSelect = React.useCallback((component: ComponentInstance | null) => {
    setSelectedComponent(component);
  }, []);

  const handlePropertyChange = React.useCallback((componentId: string, propName: string, value: any) => {
    setComponents(prev => {
      const updated = prev.map(comp => {
        if (comp.instanceId !== componentId) return comp;
        const updated = {
          ...comp,
          props: { ...comp.props, [propName]: value ?? '' }
        };
        if (selectedComponent?.instanceId === componentId) {
          setSelectedComponent(updated);
        }
        return updated;
      });
      
      componentsRef.current = updated;
      return updated;
    });

    generateAndUpdateCode();
  }, [generateAndUpdateCode, selectedComponent]);

  const handleMoveComponent = React.useCallback((dragIndex: number, hoverIndex: number) => {
    setComponents(prev => {
      const dragComponent = prev[dragIndex];
      const newComponents = [...prev];
      newComponents.splice(dragIndex, 1);
      newComponents.splice(hoverIndex, 0, dragComponent);
      componentsRef.current = newComponents;
      return newComponents;
    });
    
    generateAndUpdateCode();
  }, [generateAndUpdateCode]);

  const handleSave = React.useCallback(() => {
    try {
      const components = componentsRef.current;
      const safeComponents = components.map(comp => JSON.parse(JSON.stringify(comp)));
      const componentMarkers = safeComponents.map(comp => 
        `<!-- COMPONENT_DATA:${JSON.stringify(comp)}-->`
      );
      
      const generatedCode = generatePageCode({ components: safeComponents });
      const finalContent = `${componentMarkers.join('\n')}\n${generatedCode}`;
      
      onSave(finalContent);
    } catch (error) {
      console.error('Error saving:', error);
    }
  }, [onSave]);

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

  // Create refs array once and update it when components length changes
  const dragRefs = React.useRef<React.RefObject<any>[]>([]);
  React.useEffect(() => {
    dragRefs.current = Array(components.length).fill(null).map(() => React.createRef());
  }, [components.length]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Container maxW="100%" p={0} h="100vh" bg={bgColor}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key="editor"
            initial={false}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <HStack 
              h="100%" 
              spacing={4} 
              align="stretch" 
              p={4}
              bg={bgColor}
            >
              <Box
                w="280px"
                bg="white"
                borderRadius="xl"
                shadow="sm"
                overflow="hidden"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <ComponentPalette 
                  components={availableComponents} 
                  isLoading={isLoading}
                />
              </Box>

              <Box 
                flex={1}
                bg="white"
                borderRadius="xl"
                shadow="sm"
                overflow="hidden"
                borderWidth="1px"
                borderColor={borderColor}
                style={{
                  opacity: isDragging ? 0.7 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                <DropZone
                  components={components}
                  onDrop={handleDrop}
                  onComponentSelect={handleComponentSelect}
                  onMoveComponent={handleMoveComponent}
                  dragRefs={dragRefs.current}
                  onDragStateChange={setIsDragging}
                />
              </Box>

              <Box
                w="320px"
                bg="white"
                borderRadius="xl"
                shadow="sm"
                overflow="hidden"
                borderWidth="1px"
                borderColor={borderColor}
              >
                <PropertiesPanel
                  component={selectedComponent}
                  onPropertyChange={handlePropertyChange}
                />
              </Box>
            </HStack>
          </motion.div>
        </AnimatePresence>
      </Container>
    </DndProvider>
  );
}