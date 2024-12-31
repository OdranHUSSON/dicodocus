import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

interface FileItem {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileItem[]
}

// Point de départ pour scanner les fichiers
const ROOT_DIR = path.join(process.cwd(), 'docs')

async function scanDirectory(dirPath: string): Promise<FileItem[]> {
  const items = await fs.readdir(dirPath, { withFileTypes: true })
  const result: FileItem[] = []

  for (const item of items) {
    const fullPath = path.join(dirPath, item.name)
    if (item.isDirectory()) {
      const children = await scanDirectory(fullPath)
      result.push({
        name: item.name,
        type: 'folder',
        path: fullPath,
        children
      })
    } else if (item.name.endsWith('.md') || item.name.endsWith('.mdx')) {
      result.push({
        name: item.name,
        type: 'file',
        path: fullPath
      })
    }
  }
  return result
}

export async function GET() {
  try {
    const files = await scanDirectory(ROOT_DIR)
    return NextResponse.json(files)
  } catch (error) {
    console.error('Error scanning directory:', error)
    return NextResponse.json(
      { error: 'Failed to scan directory' },
      { status: 500 }
    )
  }
}