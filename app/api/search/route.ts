import { NextResponse } from 'next/server';
import Exa from 'exa-js';
import { NEWS_SOURCES } from '@/app/utils/api';
import { cleanArticleText, isSectionHeader } from '@/app/utils/api';

const EXA_API_KEY = process.env.EXA_API_KEY || '';
if (!EXA_API_KEY) {
  throw new Error('EXA_API_KEY is not defined');
}

const exa = new Exa(EXA_API_KEY);

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const dateString = oneWeekAgo.toISOString().split('T')[0];

    // Create a site-specific query for each news source
    const siteQueries = NEWS_SOURCES.map(source => `site:${source.domain}`).join(' OR ');
    const fullQuery = `(${siteQueries}) ${query}`;

    const searchResponse = await exa.searchAndContents(
      fullQuery,
      {
        numResults: 20,
        text: true,
        startPublishedDate: dateString,
        useAuthorExtraction: true,
        useBodyExtraction: true
      }
    );

    if (!searchResponse || !searchResponse.results) {
      throw new Error('Invalid search response from Exa');
    }

    // Filter and process results
    const validResults = searchResponse.results
      .filter(result => {
        if (!result.title || !result.publishedDate || isSectionHeader(result.title)) {
          return false;
        }
        
        const text = result.text || '';
        if (text.length < 200) {
          return false;
        }

        return true;
      })
      .map(result => ({
        id: result.id,
        title: result.title,
        url: result.url,
        publishedDate: result.publishedDate,
        summary: `${cleanArticleText(result.text || '').slice(0, 200)}...`,
        source: NEWS_SOURCES.find(source => 
          result.url.includes(source.domain)
        )?.name || 'Unknown Source'
      }))
      .sort((a, b) => {
        const dateA = new Date(a.publishedDate || '');
        const dateB = new Date(b.publishedDate || '');
        return dateB.getTime() - dateA.getTime();
      });

    return NextResponse.json(validResults, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' // Cache for 1 minute, stale for 2 minutes
      }
    });
  } catch (error) {
    console.error('Error searching news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json(
      { error: `Failed to search news: ${errorMessage}` },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store'
        }
      }
    );
  }
}
