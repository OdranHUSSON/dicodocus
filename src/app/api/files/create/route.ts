import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths } from '@/config/docusaurus'

const { docsDir, i18nDir, blogDir, pagesDir } = getPaths()
const DEFAULT_LANG = 'en'

export async function POST(request: NextRequest) {
  try {
    const { path: filePath, type, language = DEFAULT_LANG, contentType = 'docs' } = await request.json()

    if (!filePath || !type) {
      return NextResponse.json(
        { error: 'File path and type are required' },
        { status: 400 }
      )
    }

    // Clean the file path to remove language prefix if it exists
    const cleanPath = filePath.replace(/^\/[a-z]{2}\//, '/')
    
    // Remove any leading slash to make the path relative
    const relativePath = cleanPath.replace(/^\//, '')

    // Determine the full path based on language and content type
    let fullPath
    if (contentType === 'pages') {
      fullPath = path.join(pagesDir, relativePath)
    } else if (language === DEFAULT_LANG) {
      fullPath = path.join(contentType === 'docs' ? docsDir : blogDir, relativePath)
    } else {
      fullPath = path.join(i18nDir, language, `docusaurus-plugin-content-${contentType}/current`, relativePath)
    }

    // Ensure the target file is within the allowed directories
    const normalizedFullPath = path.normalize(fullPath)
    const normalizedDocsDir = path.normalize(docsDir)
    const normalizedBlogDir = path.normalize(blogDir)
    const normalizedI18nDir = path.normalize(i18nDir)
    const normalizedPagesDir = path.normalize(pagesDir)

    if (!normalizedFullPath.startsWith(normalizedDocsDir) && 
        !normalizedFullPath.startsWith(normalizedI18nDir) &&
        !normalizedFullPath.startsWith(normalizedBlogDir) &&
        !normalizedFullPath.startsWith(normalizedPagesDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      )
    }

    try {
      // Check if file/folder already exists
      await fs.access(fullPath)
      return NextResponse.json(
        { error: 'File or folder already exists' },
        { status: 409 }
      )
    } catch {
      // File/folder doesn't exist, we can proceed
    }

    // Create directory if type is folder
    if (type === 'folder') {
      await fs.mkdir(fullPath, { recursive: true })
    } else {
      // Create all necessary parent directories
      await fs.mkdir(path.dirname(fullPath), { recursive: true })
      // Create empty file
      await fs.writeFile(fullPath, '', 'utf-8')
    }

    return NextResponse.json({ 
      success: true,
      path: cleanPath,
      type,
      language
    })
  } catch (error) {
    console.error('Error creating file:', error)
    return NextResponse.json(
      { error: 'Failed to create file' },
      { status: 500 }
    )
  }
}