import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths } from '@/config/docusaurus'
import { scanDirectory } from '@/app/lib/scanDirectory'

const paths = getPaths()
const { docsDir, blogDir, pagesDir } = paths

interface FileItem {
  name: string
  type: 'file' | 'folder' 
  path: string
  children?: FileItem[]
  contentType: 'docs' | 'blog' | 'pages'
}

export async function GET() {
  const paths = getPaths()
  console.log('Full paths object:', paths)
  const { docsDir, blogDir, pagesDir } = paths

  try {
    // Add path existence checks
    for (const [name, dir] of Object.entries({ docsDir, blogDir, pagesDir })) {
      if (!dir) {
        throw new Error(`${name} is undefined`)
      }
      console.log(`Checking directory: ${name} = ${dir}`)
    }

    await fs.mkdir(docsDir, { recursive: true })
    await fs.mkdir(blogDir, { recursive: true })
    await fs.mkdir(pagesDir, { recursive: true })

    const [docsFiles, blogFiles, pagesFiles] = await Promise.all([
      scanDirectory(docsDir, 'docs', docsDir),
      scanDirectory(blogDir, 'blog', blogDir),
      scanDirectory(pagesDir, 'pages', pagesDir)
    ])

    return NextResponse.json({
      docs: docsFiles,
      blog: blogFiles,
      pages: pagesFiles
    })
  } catch (error) {
    console.error('Error in GET /api/files:', error)
    return NextResponse.json(
      { error: 'Failed to scan directories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}