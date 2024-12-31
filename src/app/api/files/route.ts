import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths } from '@/config/docusaurus'

interface FileItem {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileItem[]
}

// Get docsDir from getPaths
const { docsDir } = getPaths()

async function scanDirectory(dirPath: string): Promise<FileItem[]> {
  try {
    const items = await fs.readdir(dirPath, { withFileTypes: true })
    const result: FileItem[] = []

    for (const item of items) {
      const fullPath = path.join(dirPath, item.name)
      const relativePath = path.relative(docsDir, fullPath) // Store relative path instead of full path
      
      if (item.isDirectory()) {
        const children = await scanDirectory(fullPath)
        result.push({
          name: item.name,
          type: 'folder',
          path: relativePath,
          children
        })
      } else if (item.name.endsWith('.md') || item.name.endsWith('.mdx')) {
        result.push({
          name: item.name,
          type: 'file',
          path: relativePath
        })
      }
    }
    return result
  } catch (error) {
    console.error('Error scanning directory:', error)
    throw error
  }
}

export async function GET() {
  try {
    // Create docs directory if it doesn't exist
    try {
      await fs.access(docsDir)
    } catch {
      await fs.mkdir(docsDir, { recursive: true })
    }

    const files = await scanDirectory(docsDir)
    return NextResponse.json(files)
  } catch (error) {
    console.error('Error in GET /api/files:', error)
    return NextResponse.json(
      { error: 'Failed to scan directory' },
      { status: 500 }
    )
  }
}