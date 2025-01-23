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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a witty tech analyst with a sharp sense of humor. Explain why this news matters in 1-2 punchy sentences (max 50 words). Don't shy away from playful snark - but keep it professional. Be insightful and make it interesting."
        },
        {
          role: "user",
          content: `Title: ${title}\n\nSummary: ${summary}\n\nGive me a witty take on why this matters:`
        }
      ],
      temperature: 0.9,
      max_tokens: 150
    });

    const explanation = response.choices[0].message.content;
    return NextResponse.json({ explanation }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200' // Cache for 1 hour, stale for 2 hours
      }
    });
  } catch (error) {
    console.error('Failed to generate explanation:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}
