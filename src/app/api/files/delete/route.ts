import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths, getLanguages } from '@/config/docusaurus'

const { docsDir, blogDir, i18nDir, pagesDir } = getPaths()
const DEFAULT_LANG = 'en'

export async function DELETE(request: NextRequest) {
  try {
    const { path: filePath, language = DEFAULT_LANG, contentType = 'docs' } = await request.json()

    console.log('Delete request received:', {
      filePath,
      contentType,
      language
    })

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

    // Get list of all language directories if deleting default language
    let pathsToDelete = []
    if (language === DEFAULT_LANG) {
      // Add default language path based on content type
      pathsToDelete.push(
        path.join(
          contentType === 'docs'
            ? docsDir
            : contentType === 'pages'
              ? pagesDir
              : blogDir,
          relativePath
        )
      )
      
      // Add translated paths
      try {
        const langs = await fs.readdir(i18nDir)
        for (const lang of langs) {
          pathsToDelete.push(
            path.join(
              i18nDir,
              lang,
              contentType === 'docs'
                ? 'docusaurus-plugin-content-docs/current'
                : contentType === 'pages'
                  ? 'src/pages'
                  : 'docusaurus-plugin-content-blog',
              relativePath
            )
          )
        }
      } catch (err) {
        // Continue if i18n directory doesn't exist
      }
    } else {
      // Just delete the specific language path
      pathsToDelete.push(
        path.join(
          i18nDir,
          language,
          contentType === 'docs'
            ? 'docusaurus-plugin-content-docs/current'
            : contentType === 'pages'
              ? 'src/pages'
              : 'docusaurus-plugin-content-blog',
          relativePath
        )
      )
    }

    console.log('Attempting to delete paths:', pathsToDelete)

    // Delete all paths
    for (const pathToDelete of pathsToDelete) {
      try {
        const stats = await fs.stat(pathToDelete)
        if (stats.isDirectory()) {
          await fs.rm(pathToDelete, { recursive: true })
        } else {
          await fs.unlink(pathToDelete)
        }
      } catch (err) {
        // Skip if file/directory doesn't exist
        console.log(`Path ${pathToDelete} does not exist, skipping`)
      }
    }

    // Get available languages after deletion
    const availableLanguages = await getAvailableLanguages(cleanPath)

    return NextResponse.json({ 
      success: true,
      path: cleanPath,
      language,
      contentType,
      availableLanguages
    })
  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}

async function getAvailableLanguages(cleanPath: string): Promise<string[]> {
  const { enabledLanguages } = getLanguages();
  return enabledLanguages;
}