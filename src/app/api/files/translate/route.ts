import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'
import { getPaths, getLanguages } from '@/config/docusaurus'

const { docsDir, blogDir, i18nDir } = getPaths()
const { defaultLanguage } = getLanguages()
const DEFAULT_LANG = defaultLanguage

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY
})

const log = (message: string, data?: any) => {
  console.log(`[Translation API] ${message}`, data || '');
};

async function translateContent(content: string, targetLang: string): Promise<string> {
  log(`Starting translation to ${targetLang}`);
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a professional translator. Translate the following markdown content to ${targetLang}. 
          Preserve all markdown formatting, front matter, and code blocks exactly as they are. 
          Only translate the human-readable text content.`
      },
      {
        role: "user",
        content: content
      }
    ],
    temperature: 0.3,
  });
  log('Translation completed');
  return completion.choices[0].message.content || content;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      filePath, 
      sourceLang, 
      targetLangs,
      contentType = 'docs'
    } = await request.json()
    
    log('Received translation request', { filePath, sourceLang, targetLangs, contentType });

    if (!filePath || !sourceLang || !targetLangs || !Array.isArray(targetLangs)) {
      return NextResponse.json(
        { error: 'File path, source language, and target languages array are required' },
        { status: 400 }
      )
    }

    const cleanPath = filePath.replace(/^\/[a-z]{2}\//, '/')
    
    const sourceFilePath = sourceLang === DEFAULT_LANG
      ? path.join(contentType === 'docs' ? docsDir : blogDir, cleanPath)
      : path.join(
          i18nDir, 
          sourceLang, 
          contentType === 'docs' 
            ? 'docusaurus-plugin-content-docs/current' 
            : 'docusaurus-plugin-content-blog',
          cleanPath
        )

    const sourceContent = await fs.readFile(sourceFilePath, 'utf-8')

    // Translate to each target language
    for (const targetLang of targetLangs) {
      const translatedContent = await translateContent(sourceContent, targetLang)
      
      const targetFilePath = targetLang === DEFAULT_LANG
        ? path.join(contentType === 'docs' ? docsDir : blogDir, cleanPath)
        : path.join(
            i18nDir, 
            targetLang, 
            contentType === 'docs' 
              ? 'docusaurus-plugin-content-docs/current' 
              : 'docusaurus-plugin-content-blog',
            cleanPath
          )

      await fs.mkdir(path.dirname(targetFilePath), { recursive: true })
      await fs.writeFile(targetFilePath, translatedContent, 'utf-8')
      
      log(`Translated and saved to ${targetLang}`, { targetFilePath });
    }

    return NextResponse.json({ 
      success: true,
      contentType,
      sourceLang,
      targetLangs,
      path: cleanPath
    })

  } catch (error) {
    log('Translation error occurred', error);
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Failed to translate file' },
      { status: 500 }
    )
  }
}