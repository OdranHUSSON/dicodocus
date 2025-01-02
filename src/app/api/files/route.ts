import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths } from '@/config/docusaurus'

const paths = getPaths()
const { docsDir, blogDir } = paths

interface FileItem {
  name: string
  type: 'file' | 'folder' 
  path: string
  children?: FileItem[]
  contentType: 'docs' | 'blog'
}

async function scanDirectory(dirPath: string, contentType: 'docs' | 'blog', baseDir: string): Promise<FileItem[]> {
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

export async function GET() {
  try {
    await fs.mkdir(docsDir, { recursive: true })
    await fs.mkdir(blogDir, { recursive: true })

    const [docsFiles, blogFiles] = await Promise.all([
      scanDirectory(docsDir, 'docs', docsDir),
      scanDirectory(blogDir, 'blog', blogDir)
    ])

    return NextResponse.json({
      docs: docsFiles,
      blog: blogFiles
    })
  } catch (error) {
    console.error('Error in GET /api/files:', error)
    return NextResponse.json(
      { error: 'Failed to scan directories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}