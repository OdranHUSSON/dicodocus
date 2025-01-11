import { FileItem } from '@/components/FileExplorer'
import fs from 'fs/promises'
import path from 'path'

export async function scanDirectory(dirPath: string, contentType: 'docs' | 'blog' | 'pages', baseDir: string): Promise<FileItem[]> {
    try {
      try {
        await fs.access(dirPath)
      } catch {
        await fs.mkdir(dirPath, { recursive: true })
      }
  
      const items = await fs.readdir(dirPath, { withFileTypes: true })
      const result: FileItem[] = []
  
      for (const item of items) {
        const fullPath = path.join(dirPath, item.name)
        const relativePath = path.relative(baseDir, fullPath).replace(/^\.\.\/aismarttalk-docs\/(blog|docs)\//, '')
        
        if (item.isDirectory()) {
          const children = await scanDirectory(fullPath, contentType, baseDir)
          result.push({
            name: item.name,
            type: 'folder',
            path: relativePath,
            children,
            contentType
          })
        } else if (item.name.endsWith('.md') || item.name.endsWith('.mdx')) {
          result.push({
            name: item.name,
            type: 'file',
            path: relativePath,
            contentType
          })
        }
      }
      return result
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error)
      throw error
    }
  }