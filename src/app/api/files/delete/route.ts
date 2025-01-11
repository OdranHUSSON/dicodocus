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

    // Get list of all language directories if deleting default language
    let pathsToDelete = []
    if (language === DEFAULT_LANG) {
      // Add default language path
      pathsToDelete.push(path.join(contentType === 'docs' ? docsDir : blogDir, relativePath))
      
      // Add translated paths
      try {
        const langs = await fs.readdir(i18nDir)
        for (const lang of langs) {
          pathsToDelete.push(
            path.join(i18nDir, lang, `docusaurus-plugin-content-${contentType}/current`, relativePath)
          )
        }
      } catch (err) {
        // Continue if i18n directory doesn't exist
      }
    } else {
      // Just delete the specific language path
      pathsToDelete.push(
        path.join(i18nDir, language, `docusaurus-plugin-content-${contentType}/current`, relativePath)
      )
    }

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
      }
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