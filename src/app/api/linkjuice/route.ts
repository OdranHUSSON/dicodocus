import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { transformMarkdown, LinkJuiceItem, MultiLangLinkJuiceConfig } from '@/app/lib/markdownTools/linkJuiceTransformer'
import { getPaths } from '@/config/docusaurus'

// These are just placeholders; your getPaths might differ
const { docsDir, blogDir, pagesDir, mediaDir,i18nDir } = getPaths()

// The location of your linkjuice config JSON
const LINKJUICE_FILE_PATH = path.join(mediaDir, 'linkjuice.json');

async function readLinkJuiceConfig(): Promise<MultiLangLinkJuiceConfig> {
  try {
    const data = await fs.readFile(LINKJUICE_FILE_PATH, 'utf-8')
    return JSON.parse(data) as MultiLangLinkJuiceConfig
  } catch (err) {
    return {}
  }
}

/** Return the absolute file path based on content type. */
const DEFAULT_LANG = 'en'

export function getDirectoryPathByContentType(
  contentType: 'docs' | 'blog' | 'pages',
  lang: string
): string {
  // If it's the default language, use the normal folder
  if (lang === DEFAULT_LANG) {
    switch (contentType) {
      case 'docs':
        return docsDir
      case 'blog':
        return blogDir
      case 'pages':
        return pagesDir
      default:
        throw new Error(`Unsupported content type: ${contentType}`)
    }
  }

  // Otherwise, use i18n
  // Mimic your "save" route logic for i18n subfolders
  switch (contentType) {
    case 'docs':
      // i18n/{lang}/docusaurus-plugin-content-docs/current
      return path.join(i18nDir, lang, 'docusaurus-plugin-content-docs/current')
    case 'blog':
      // i18n/{lang}/docusaurus-plugin-content-blog
      return path.join(i18nDir, lang, 'docusaurus-plugin-content-blog')
    case 'pages':
      // i18n/{lang}/src/pages
      return path.join(i18nDir, lang, 'src/pages')
    default:
      throw new Error(`Unsupported content type: ${contentType}`)
  }
}


/** Transform a single file with the language-specific linkjuice config. */
async function transformContentFile(
  filePath: string,
  contentType: 'docs' | 'blog' | 'pages',
  lang: string,
  allLangConfigs: MultiLangLinkJuiceConfig
) {
  const directory = getDirectoryPathByContentType(contentType, lang)
  const fullFilePath = path.join(directory, filePath)

  // 1. Read the file's markdown
  const fileContent = await fs.readFile(fullFilePath, 'utf-8')

  // 2. Transform using the multi-language config
  const newContent = transformMarkdown(fileContent, allLangConfigs, lang, contentType)

  // 3. Write the file back
  await fs.writeFile(fullFilePath, newContent, 'utf-8')
  return { message: `File ${filePath} transformed successfully for lang: ${lang}.` }
}

// --- GET /api/linkjuice
export async function GET() {
  try {
    const config = await readLinkJuiceConfig()
    return NextResponse.json(config)
  } catch (error) {
    return NextResponse.json(
      { error: 'Could not read linkjuice config', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/linkjuice
 * 
 * Example request body:
 * {
 *   "lang": "en",
 *   "filePath": "my-post.md",
 *   "contentType": "blog"
 * }
 * 
 * or multiple:
 * {
 *   "lang": "fr",
 *   "files": [
 *     { "filePath": "mon-post.md", "contentType": "blog" },
 *     { "filePath": "introduction.md", "contentType": "docs" }
 *   ]
 * }
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { lang } = body

    if (!lang) {
      return NextResponse.json(
        { error: 'Missing "lang" in request body.' },
        { status: 400 }
      )
    }

    const config = await readLinkJuiceConfig()

    // Single vs. multiple
    if (Array.isArray(body.files)) {
      const results = []
      for (const { filePath, contentType } of body.files) {
        const res = await transformContentFile(filePath, contentType, lang, config)
        results.push(res)
      }
      return NextResponse.json({ results })
    } else if (body.filePath && body.contentType) {
      const { filePath, contentType } = body
      const result = await transformContentFile(filePath, contentType, lang, config)
      return NextResponse.json(result)
    } else {
      return NextResponse.json(
        { error: 'Invalid body. Provide either "files" array or "filePath"/"contentType".' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error in PATCH /api/linkjuice:', error)
    return NextResponse.json(
      { error: 'Failed to transform content', details: String(error) },
      { status: 500 }
    )
  }
}