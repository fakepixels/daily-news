import { NextResponse } from 'next/server';
import Exa from 'exa-js';
import { NEWS_SOURCES } from '@/app/utils/api';
import { cleanArticleText, isSectionHeader } from '@/app/utils/api';

const EXA_API_KEY = process.env.EXA_API_KEY || '';
if (!EXA_API_KEY) {
  throw new Error('EXA_API_KEY is not defined');
}

const exa = new Exa(EXA_API_KEY);

interface SearchResult {
  id: string;
  title: string;
  url: string;
  publishedDate: string;
  summary: string;
  source: string;
}

// Cache for search results
const searchCache = new Map<string, { results: SearchResult[]; timestamp: number }>();
const SEARCH_CACHE_TTL = 300000; // 5 minutes in milliseconds

export async function POST(request: Request) {
  try {
    const { query } = await request.json();
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = query.trim().toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < SEARCH_CACHE_TTL) {
      return NextResponse.json(cached.results, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      });
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
        numResults: 10, // Reduced from 20 to save credits
        text: true,
        startPublishedDate: dateString,
        useAuthorExtraction: false, // Disabled as we don't use this
        useBodyExtraction: true,
        sortBy: 'relevance',
        excludeSites: [
          'bloomberg.com/press-releases',
          'bloomberg.com/company',
          'bloomberg.com/about',
          'bloomberg.com/feedback',
          'bloomberg.com/notices'
        ]
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
        id: result.id || crypto.randomUUID(),
        title: result.title || 'Untitled',
        url: result.url,
        publishedDate: result.publishedDate || dateString,
        summary: `${cleanArticleText(result.text || '').slice(0, 200)}...`,
        source: NEWS_SOURCES.find(source => 
          result.url.includes(source.domain)
        )?.name || 'Unknown Source'
      }));

    // Cache the results
    searchCache.set(cacheKey, { results: validResults, timestamp: Date.now() });

    return NextResponse.json(validResults, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
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
