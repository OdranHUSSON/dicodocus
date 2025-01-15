import OpenAI from 'openai';

export async function translateChunk(
  openaiClient: OpenAI,
  chunk: string,
  targetLang: string
): Promise<string> {
  // Skip empty chunks
  if (!chunk.trim()) return chunk;

  // Example translation logic
  const completion = await openaiClient.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a professional translator. Translate the following content to ${targetLang}. 
                  Preserve all markdown formatting, front matter, and code blocks. 
                  Only translate the human-readable text.`
      },
      {
        role: 'user',
        content: chunk
      }
    ],
    temperature: 0.3,
  });

  return completion.choices[0]?.message?.content ?? chunk;
}

export async function translateMarkdownContent(
  openaiClient: OpenAI,
  content: string,
  targetLang: string,
  splitter: (s: string) => string[],      // inject splitting function
  joiner: (arr: string[]) => string      // inject joining function
): Promise<string> {
  const paragraphs = splitter(content);

  const translatedParagraphs: string[] = [];
  for (const paragraph of paragraphs) {
    const translated = await translateChunk(openaiClient, paragraph, targetLang);
    translatedParagraphs.push(translated);
  }

  return joiner(translatedParagraphs);
}
