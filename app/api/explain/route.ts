import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined');
}

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { title, summary } = await request.json();

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert tech analyst. Explain why a piece of tech news is significant in exactly 1-2 sentences. Focus on business impact, industry implications, or technological significance. Be concise and insightful."
        },
        {
          role: "user",
          content: `Title: ${title}\n\nSummary: ${summary}\n\nExplain why this news is significant:`
        }
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    const explanation = response.choices[0].message.content;
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Failed to generate explanation:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
} 