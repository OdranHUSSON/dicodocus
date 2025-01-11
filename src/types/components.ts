export interface PropConfig {
    type: string;
    default: any;
    required?: boolean;
    description?: string;
  }
  
  export interface ComponentTemplate {
    id: string;
    name: string;
    category: string;
    filePath: string;
    propConfigs: {
      [key: string]: PropConfig;
    };
  }
  
  export interface ComponentInstance extends ComponentTemplate {
    instanceId: string;
    props: {
      [key: string]: any;
    };
  }
  
  export interface DragDropEditorProps {
    content: string;
    onChange: (value: string) => void;
    onSave: (content: string) => void;
  }