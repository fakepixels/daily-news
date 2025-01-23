import { NextResponse } from 'next/server';
import { fetchAllNews } from '@/app/utils/api';

export const revalidate = 300; // Cache for 5 minutes

export async function POST(request: Request) {
  try {
    const { customSources } = await request.json();
    const news = await fetchAllNews(customSources);
    return NextResponse.json(news, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to fetch news: ${errorMessage}` },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}
