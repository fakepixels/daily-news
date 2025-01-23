import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/app/utils/api';

export async function GET() {
  try {
    const news = await fetchAllNews();
    return NextResponse.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to fetch news: ${errorMessage}` },
      { status: 500 }
    );
  }
}
