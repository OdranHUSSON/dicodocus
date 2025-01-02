import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths } from '@/config/docusaurus'

const { docsDir, i18nDir, blogDir } = getPaths()
const DEFAULT_LANG = 'en'

export async function DELETE(request: NextRequest) {
  try {
    const { path: filePath, language = DEFAULT_LANG, contentType = 'docs' } = await request.json()

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    // Clean the file path to remove language prefix if it exists
    const cleanPath = filePath.replace(/^\/[a-z]{2}\//, '/')
    
    // Remove any leading slash to make the path relative
    const relativePath = cleanPath.replace(/^\//, '')

    // Determine the full path based on language and content type
    const fullPath = language === DEFAULT_LANG
      ? path.join(contentType === 'docs' ? docsDir : blogDir, relativePath)
      : path.join(i18nDir, language, `docusaurus-plugin-content-${contentType}/current`, relativePath)

    // Check if path exists
    try {
      await fs.access(fullPath)
    } catch {
      return NextResponse.json(
        { error: 'File or folder not found' },
        { status: 404 }
      )
    }

    // Delete the file or directory
    const stats = await fs.stat(fullPath)
    if (stats.isDirectory()) {
      await fs.rm(fullPath, { recursive: true })
    } else {
      await fs.unlink(fullPath)
    }

    return NextResponse.json({ 
      success: true,
      path: cleanPath,
      language
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}