import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths, getLanguages } from '@/config/docusaurus'

const { docsDir, blogDir, i18nDir, pagesDir } = getPaths()
const { defaultLanguage } = getLanguages()
const DEFAULT_LANG = process.env.NEXT_PUBLIC_DOCUSAURUS_DEFAULT_LANG || 'en'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const filePath = searchParams.get('path')
    const lang = searchParams.get('lang') || DEFAULT_LANG
    const contentType = searchParams.get('contentType') || 'docs'

    if (!filePath) {
      return NextResponse.json({ error: 'File path is required' }, { status: 400 })
    }

    const cleanPath = filePath.replace(/^\/[a-z]{2}\//, '/')

    const getFullPath = (language: string) => {
      if (language === DEFAULT_LANG) {
        switch (contentType) {
          case 'blog':
            return path.join(blogDir, cleanPath)
          case 'pages':
            return path.join(pagesDir, cleanPath)
          default: // 'docs'
            return path.join(docsDir, cleanPath)
        }
      } else {
        switch (contentType) {
          case 'blog':
            return path.join(i18nDir, language, 'docusaurus-plugin-content-blog', cleanPath)
          case 'pages':
            return path.join(i18nDir, language, 'docusaurus-plugin-content-pages', cleanPath)
          default: // 'docs'
            return path.join(i18nDir, language, 'docusaurus-plugin-content-docs/current', cleanPath)
        }
      }
    }

    const requestedPath = getFullPath(lang)
    const defaultPath = getFullPath(DEFAULT_LANG)

    const isValidPath = (pathToCheck: string) => {
      const normalizedPath = path.normalize(pathToCheck)
      const normalizedDocsDir = path.normalize(docsDir)
      const normalizedBlogDir = path.normalize(blogDir)
      const normalizedPagesDir = path.normalize(pagesDir)
      const normalizedI18nDir = path.normalize(i18nDir)

      if (lang === DEFAULT_LANG) {
        switch (contentType) {
          case 'blog':
            return normalizedPath.startsWith(normalizedBlogDir)
          case 'pages':
            return normalizedPath.startsWith(normalizedPagesDir)
          default: // 'docs'
            return normalizedPath.startsWith(normalizedDocsDir)
        }
      } else {
        return normalizedPath.startsWith(normalizedI18nDir)
      }
    }

    if (!isValidPath(requestedPath)) {
      return NextResponse.json(
        { error: 'Invalid file path', debug: { requestedPath, docsDir, i18nDir } },
        { status: 403 }
      )
    }

    let content: string
    let usedPath: string
    let usedLang: string

    try {
      content = await fs.readFile(requestedPath, 'utf-8')
      usedPath = requestedPath
      usedLang = lang
    } catch (error) {
      if (lang !== DEFAULT_LANG) {
        try {
          content = await fs.readFile(defaultPath, 'utf-8')
          usedPath = defaultPath
          usedLang = DEFAULT_LANG
        } catch (error) {
          return NextResponse.json({ error: 'File not found in any language' }, { status: 404 })
        }
      } else {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
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
    return NextResponse.json({ error: 'Failed to read file' }, { status: 500 })
  }
}

async function getAvailableLanguages(cleanPath: string): Promise<string[]> {
  const { enabledLanguages } = getLanguages();
  return enabledLanguages;
}
