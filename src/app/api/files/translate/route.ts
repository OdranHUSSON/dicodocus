import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'
import OpenAI from 'openai'

import { getPaths, getLanguages } from '@/config/docusaurus'
import {
  // Advanced block splitting and rejoining
  splitMarkdownByBlocks,
  joinMarkdownBlocks,
  MarkdownBlock
} from '@/app/lib/markdownTools/markdownSplitter'
  // ^ Adjust your import path as needed

const { docsDir, blogDir, i18nDir } = getPaths()
const { defaultLanguage } = getLanguages()
const DEFAULT_LANG = defaultLanguage

// You can adjust the model or any parameters
const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY
})

export async function POST(request: NextRequest) {
  try {
    // 1. Parse request body
    const {
      filePath,
      sourceLang,
      targetLangs,
      contentType = 'docs' // "docs" or "blog"
    } = await request.json()

    // 2. Validate input
    if (!filePath || !sourceLang || !targetLangs || !Array.isArray(targetLangs)) {
      return NextResponse.json(
        { error: 'Missing or invalid request parameters' },
        { status: 400 }
      )
    }

    // 3. Clean up path (remove leading "/en/", "/fr/", etc.)
    const cleanPath = filePath.replace(/^\/[a-z]{2}\//, '/')

    // 4. Determine source file path
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

    // 5. Read source content (Markdown)
    const sourceContent = await fs.readFile(sourceFilePath, 'utf-8')

    // 6. Parse into blocks
    const blocks = splitMarkdownByBlocks(sourceContent)

    // 7. For each target language, do block-level translation
    for (const targetLang of targetLangs) {
      // Copy the blocks so we don’t mutate the original array across multiple translations
      const translatedBlocks = [...blocks]

      // Translate only certain blocks (e.g. "paragraph" or "heading")
      for (let i = 0; i < translatedBlocks.length; i++) {
        const block = translatedBlocks[i]

        // Skip frontmatter + code blocks
        if (block.type === 'frontmatter' || block.type === 'code') {
          continue
        }

        console.log("translating block $" + i + " to " + targetLang)

        // Otherwise, it's a heading or paragraph. Translate it chunk by chunk.
        // (If blocks are *still* too big, you can further chunk them inside the loop.)
        const completion = await openai.chat.completions.create({
          model: 'gpt-3.5-turbo', // or 'gpt-4', etc.
          messages: [
            {
              role: 'system',
              content: `You are a professional translator. Translate the text below into ${targetLang} (iso2 lang format). 
                        Preserve Markdown formatting. Do NOT translate code blocks or front matter.`
            },
            {
              role: 'user',
              content: block.content
            }
          ],
          temperature: 0.3
        })

        const translatedText = completion.choices[0]?.message?.content || block.content
        translatedBlocks[i] = {
          ...block,
          content: translatedText
        }
      }

      // 8. Rejoin the translated blocks
      const finalContent = joinMarkdownBlocks(translatedBlocks)

      // 9. Determine the target file path
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

      // Ensure directory exists
      await fs.mkdir(path.dirname(targetFilePath), { recursive: true })

      // 10. Write translated file
      await fs.writeFile(targetFilePath, finalContent, 'utf-8')
      console.log(`[Translation API] Wrote translated file: ${targetFilePath}`)
    }

    return NextResponse.json({
      success: true,
      sourceLang,
      targetLangs,
      path: cleanPath
    })

  } catch (error) {
    console.error('Translation error:', error)
    return NextResponse.json(
      { error: 'Failed to translate file', details: String(error) },
      { status: 500 }
    )
  }
}
