import { ComponentInstance } from "@/types/components";

interface GenerateCodeOptions {
    components: ComponentInstance[];
    indent?: string;
  }
  
  export function generatePageCode({ components, indent = '  ' }: GenerateCodeOptions): string {
    const imports = new Set<string>();
    let code = '';
  
    // Add imports
    components.forEach(component => {
      imports.add(`import ${component.name} from '@site/src/components/${component.filePath.replace(/\.[jt]sx?$/, '')}';`);
    });
  
    // Generate the page code
    code += Array.from(imports).sort().join('\n') + '\n\n';
    code += 'export default function Page() {\n';
    code += `${indent}return (\n`;
    code += `${indent}${indent}<>\n`;
  
    // Add components
    components.forEach(component => {
      const props = Object.entries(component.props)
        .map(([key, value]) => {
          if (typeof value === 'string') {
            return `${key}="${value}"`;
          }
          return `${key}={${JSON.stringify(value)}}`;
        })
        .join(' ');
  
      code += `${indent}${indent}${indent}<${component.name} ${props} />\n`;
    });
  
    code += `${indent}${indent}</>\n`;
    code += `${indent});\n`;
    code += '}\n';
  
    return code;
  }