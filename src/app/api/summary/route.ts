import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getPaths, getLanguages } from '@/config/docusaurus';
import { scanDirectory } from '@/app/lib/scanDirectory';

async function countFiles(items: Awaited<ReturnType<typeof scanDirectory>>) {
  let count = 0;
  for (const item of items) {
    if (item.type === 'file') {
      count++;
    }
    if (item.children) {
      count += await countFiles(item.children);
    }
  }
  return count;
}

async function countTranslations(files: Awaited<ReturnType<typeof scanDirectory>>, i18nDir: string, contentType: string, languages: string[]) {
  let translated = 0;
  let untranslated = 0;

  async function processItem(item: (typeof files)[0]) {
    if (item.type === 'file') {
      for (const lang of languages) {
        const translationPath = path.join(
          i18nDir,
          lang,
          `docusaurus-plugin-content-${contentType}`,
          contentType === 'docs' ? 'current' : '',
          item.path
        );
        try {
          await fs.access(translationPath);
          translated++;
        } catch {
          untranslated++;
        }
      }
    }
    if (item.children) {
      for (const child of item.children) {
        await processItem(child);
      }
    }
  }

  for (const file of files) {
    await processItem(file);
  }

  return { translated, untranslated };
}

export async function GET() {
  try {
    const { docsDir, blogDir, pagesDir, i18nDir } = getPaths();
    const { enabledLanguages, defaultLanguage } = getLanguages();
    const LANGUAGES = enabledLanguages.filter(lang => lang !== defaultLanguage);

    // Create directories if they don't exist
    await Promise.all([
      fs.mkdir(docsDir, { recursive: true }),
      fs.mkdir(blogDir, { recursive: true }), 
      fs.mkdir(pagesDir, { recursive: true })
    ]);

    // Scan all directories
    const [docsFiles, blogFiles, pagesFiles] = await Promise.all([
      scanDirectory(docsDir, 'docs', docsDir),
      scanDirectory(blogDir, 'blog', blogDir),
      scanDirectory(pagesDir, 'pages', pagesDir)
    ]);

    // Count files
    const [docsCount, blogCount, pagesCount] = await Promise.all([
      countFiles(docsFiles),
      countFiles(blogFiles),
      countFiles(pagesFiles)
    ]);

    // Count translations
    const [docsTranslations, blogTranslations, pagesTranslations] = await Promise.all([
      countTranslations(docsFiles, i18nDir, 'docs', LANGUAGES),
      countTranslations(blogFiles, i18nDir, 'blog', LANGUAGES),
      countTranslations(pagesFiles, i18nDir, 'pages', LANGUAGES)
    ]);

    return NextResponse.json({
      posts: blogCount,
      docs: docsCount,
      pages: pagesCount,
      defaultLanguage,
      availableLanguages: enabledLanguages,
      translations: {
        docs: docsTranslations,
        blog: blogTranslations,
        pages: pagesTranslations
      }
    });

  } catch (error) {
    console.error('Error generating summary:', error);
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    );
  }
}