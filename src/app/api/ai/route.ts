import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPEN_AI_API_KEY
})

// Logging helper
const log = (message: string, data?: any) => {
  console.log(`[AI API] ${message}`, data || '');
};

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    log('Received AI request');

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant integrated in a docusaurus markdown editor, no need to wrap text with tilds only code or mermaid, you should only provide the required changes with no explanations."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
    });

    return NextResponse.json({ response: completion.choices[0].message.content });

  } catch (error) {
    log('AI request error occurred');
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}