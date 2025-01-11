import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths, getLanguages } from '@/config/docusaurus'

const { docsDir, blogDir, i18nDir, pagesDir } = getPaths()
const DEFAULT_LANG = 'en'

export async function POST(request: NextRequest) {
  try {
    const { 
      path: filePath, 
      content, 
      language = DEFAULT_LANG,
      contentType = 'docs'
    } = await request.json()

    console.log('Save request received:', {
      filePath,
      contentType,
      language,
      content: content.substring(0, 100) + '...'
    })

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
      ? path.join(
          contentType === 'docs' 
            ? docsDir 
            : contentType === 'pages'
              ? pagesDir    // Use pagesDir for pages
              : blogDir, 
          cleanPath
        )
      : path.join(
          i18nDir, 
          language,
          contentType === 'docs' 
            ? 'docusaurus-plugin-content-docs/current' 
            : contentType === 'pages'
              ? 'src/pages'   // Use src/pages for i18n pages
              : 'docusaurus-plugin-content-blog',
          cleanPath
        )

    console.log('Attempting to save to:', fullPath)

    // Create all necessary parent directories
    await fs.mkdir(path.dirname(fullPath), { recursive: true })

    // Write/overwrite the file
    await fs.writeFile(fullPath, content, 'utf-8')
    console.log('File saved successfully')

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