import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import { getPaths, getLanguages } from '@/config/docusaurus'

// Replace hardcoded paths and languages with config
const { docsDir, i18nDir } = getPaths()
const { enabledLanguages, defaultLanguage } = getLanguages()
// Filter out the default language from enabled languages
const LANGUAGES = enabledLanguages.filter(lang => lang !== defaultLanguage)

interface MissingTranslation {
  path: string
  missingIn: string[]
}

async function getDocFiles(dirPath: string): Promise<Set<string>> {
  const files = new Set<string>()
  
  async function scan(currentPath: string, basePath: string) {
    const items = await fs.readdir(currentPath, { withFileTypes: true })
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item.name)
      if (item.isDirectory()) {
        await scan(fullPath, basePath)
      } else if (item.name.endsWith('.md') || item.name.endsWith('.mdx')) {
        const relativePath = path.relative(basePath, fullPath)
        files.add(relativePath)
      }
    }
  }
  
  await scan(dirPath, dirPath)
  return files
}

export async function GET() {
  try {
    // Get all English (default) files using configured path
    const englishFiles = await getDocFiles(docsDir)
    const missingTranslations: MissingTranslation[] = []

    // For each English file, check if it exists in other languages
    for (const filePath of Array.from(englishFiles)) {
      const missing: string[] = []

      for (const lang of LANGUAGES) {
        const translationPath = path.join(
          i18nDir,
          lang,
          'docusaurus-plugin-content-docs/current',
          filePath
        )

        try {
          await fs.access(translationPath)
        } catch {
          missing.push(lang)
        }
      }

      if (missing.length > 0) {
        missingTranslations.push({
          path: filePath,
          missingIn: missing
        })
      }
    }

    return NextResponse.json(missingTranslations)
  } catch (error) {
    console.error('Error checking missing translations:', error)
    return NextResponse.json(
      { error: 'Failed to check missing translations' },
      { status: 500 }
    )
  }
}