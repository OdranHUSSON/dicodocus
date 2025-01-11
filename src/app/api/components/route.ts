import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths, config } from '@/config/docusaurus'

// Use the rootDir from config which respects DOCUSAURUS_ROOT_PATH
const { rootDir } = config

interface Component {
  id: string;
  name: string;
  category: string;
  filePath: string;
  propConfigs: {
    [key: string]: {
      type: string;
      default: any;
      required?: boolean;
      description?: string;
    };
  };
}

async function scanComponentsDirectory(): Promise<Component[]> {
  try {
    // Log the root directory for debugging
    console.log('Root directory from env:', rootDir)
    
    const componentsDir = path.resolve(rootDir, 'src/components')
    console.log('Components directory:', componentsDir)

    // Check if directory exists
    const dirExists = await fs.access(componentsDir).then(() => true).catch(() => false)
    if (!dirExists) {
      console.error('Components directory does not exist:', componentsDir)
      return []
    }

    // Get all files recursively
    const getAllFiles = async (dir: string): Promise<string[]> => {
      const entries = await fs.readdir(dir, { withFileTypes: true })
      const files = await Promise.all(entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name)
        return entry.isDirectory() ? getAllFiles(fullPath) : fullPath
      }))
      return files.flat()
    }

    const files = await getAllFiles(componentsDir)
    console.log('Found files:', files)

    const components: Component[] = []

    for (const filePath of files) {
      if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) {
        console.log('Processing file:', filePath)
        const content = await fs.readFile(filePath, 'utf-8')
        
        // Improved component detection regex
        const componentMatch = content.match(
          /export\s+(?:default\s+)?(?:function|const)\s+(\w+)|class\s+(\w+)\s+extends\s+React\.Component/
        )

        if (componentMatch) {
          const name = componentMatch[1] || componentMatch[2]
          console.log('Found component:', name)
          
          // Improved props detection
          const propsMatch = content.match(/interface\s+(\w+Props)\s*{([^}]+)}/)
          const propConfigs: Component['propConfigs'] = {}
          
          if (propsMatch) {
            console.log('Found props interface for:', name)
            const propsContent = propsMatch[2]
            const propLines = propsContent.split('\n')
            
            for (const line of propLines) {
              const propMatch = line.match(/(\w+)(\?)?:\s*([^;]+)/)
              if (propMatch) {
                const [_, propName, optional, propType] = propMatch
                propConfigs[propName] = {
                  type: propType.trim(),
                  required: !optional,
                  default: undefined
                }
              }
            }
          }

          // Get relative path from components directory
          const relativePath = path.relative(componentsDir, filePath)
          const category = path.dirname(relativePath).split(path.sep)[0]

          components.push({
            id: name.toLowerCase(),
            name,
            category: category === '.' ? 'general' : category,
            filePath: relativePath,
            propConfigs
          })
        }
      }
    }

    console.log('Found components:', components)
    return components

  } catch (error) {
    console.error('Error scanning components directory:', error)
    console.error('Error details:', error instanceof Error ? error.message : error)
    return []
  }
}

export async function GET(request: NextRequest) {
  try {
    const components = await scanComponentsDirectory()
    return NextResponse.json({ components })
  } catch (error) {
    console.error('Error in components API:', error)
    return NextResponse.json({ error: 'Failed to fetch components' }, { status: 500 })
  }
}