import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths, getLanguages } from '@/config/docusaurus'

const { docsDir, i18nDir } = getPaths()
const { defaultLanguage } = getLanguages()

// Update to use environment variables for language settings
const DEFAULT_LANG = process.env.DOCUSAURUS_DEFAULT_LANG || 'en'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filePath = searchParams.get('path')
    const lang = searchParams.get('lang') || DEFAULT_LANG

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      )
    }

    // Clean the file path to remove language prefix if it exists
    const cleanPath = filePath.replace(/^\/[a-z]{2}\//, '/')

    let content: string
    let usedPath: string
    let usedLang: string

    // Function to get the full path based on language
    const getFullPath = (language: string) => {
      // Only use i18n directory for non-default languages
      if (language === DEFAULT_LANG) {
        return path.join(docsDir, cleanPath)
      } else {
        return path.join(i18nDir, language, 'docusaurus-plugin-content-docs/current', cleanPath)
      }
    }

    const requestedPath = getFullPath(lang)
    const defaultPath = getFullPath(DEFAULT_LANG)

    const isValidPath = (pathToCheck: string) => {
      const normalizedPath = path.normalize(pathToCheck);
      const normalizedDocsDir = path.normalize(docsDir);
      const normalizedI18nDir = path.normalize(i18nDir);

      if (lang === DEFAULT_LANG) {
        return normalizedPath.startsWith(normalizedDocsDir);
      } else {
        return normalizedPath.startsWith(normalizedI18nDir);
      }
    }

    // Add debug logging
    console.log({
      requestedPath,
      defaultPath,
      docsDir,
      i18nDir,
      isValid: isValidPath(requestedPath)
    })   

    // Check if the requested path is valid
    if (!isValidPath(requestedPath)) {
      return NextResponse.json(
        { error: 'Invalid file path', debug: { requestedPath, docsDir, i18nDir } },
        { status: 403 }
      )
    }

    try {
      // First try the requested language
      content = await fs.readFile(requestedPath, 'utf-8')
      usedPath = requestedPath
      usedLang = lang
    } catch (error) {
      // If not found and not English, try English
      if (lang !== DEFAULT_LANG) {
        try {
          content = await fs.readFile(defaultPath, 'utf-8')
          usedPath = defaultPath
          usedLang = DEFAULT_LANG
        } catch (error) {
          return NextResponse.json(
            { error: 'File not found in any language' },
            { status: 404 }
          )
        }
      } else {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        )
      }
    }

    return NextResponse.json({
      content,
      language: usedLang,
      path: cleanPath,
      availableLanguages: await getAvailableLanguages(cleanPath)
    })
  } catch (error) {
    console.error('Error reading file:', error)
    return NextResponse.json(
      { error: 'Failed to read file' },
      { status: 500 }
    )
  }
}
async function getAvailableLanguages(cleanPath: string): Promise<string[]> {
  const { enabledLanguages } = getLanguages();
  return enabledLanguages;
}
