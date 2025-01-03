import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths, getLanguages } from '@/config/docusaurus'

const { docsDir, blogDir, i18nDir } = getPaths()
const DEFAULT_LANG = 'en'

export async function POST(request: NextRequest) {
  try {
    const { 
      path: filePath, 
      content, 
      language = DEFAULT_LANG,
      contentType = 'docs'
    } = await request.json()

    if (!filePath || content === undefined) {
      return NextResponse.json(
        { error: 'File path and content are required' },
        { status: 400 }
      )
    }

    // Clean the file path to remove language prefix if it exists
    const cleanPath = filePath.replace(/^\/[a-z]{2}\//, '/')

    // Determine the full path based on language and content type
    const fullPath = language === DEFAULT_LANG
      ? path.join(contentType === 'docs' ? docsDir : blogDir, cleanPath)
      : path.join(
          i18nDir, 
          language, 
          contentType === 'docs' ? 'docusaurus-plugin-content-docs/current' : 'docusaurus-plugin-content-blog',
          cleanPath
        )

    // Normalize paths for comparison
    const normalizedFullPath = path.normalize(fullPath)
    const normalizedDocsDir = path.normalize(docsDir)
    const normalizedBlogDir = path.normalize(blogDir)
    const normalizedI18nDir = path.normalize(i18nDir)

    // Check if the normalized path starts with any of the allowed directories
    if (!normalizedFullPath.startsWith(normalizedDocsDir) && 
        !normalizedFullPath.startsWith(normalizedBlogDir) && 
        !normalizedFullPath.startsWith(normalizedI18nDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      )
    }

    // Create all necessary parent directories
    await fs.mkdir(path.dirname(fullPath), { recursive: true })

    // Write/overwrite the file
    await fs.writeFile(fullPath, content, 'utf-8')

    // After saving, get the updated list of available languages
    const availableLanguages = await getAvailableLanguages(cleanPath)

    return NextResponse.json({ 
      success: true,
      path: cleanPath,
      language,
      contentType,
      availableLanguages
    })
  } catch (error) {
    console.error('Error saving file:', error)
    return NextResponse.json(
      { error: 'Failed to save file' },
      { status: 500 }
    )
  }
}

async function getAvailableLanguages(cleanPath: string): Promise<string[]> {
  const { enabledLanguages } = getLanguages();
  return enabledLanguages;
}