import Exa from 'exa-js';

const EXA_API_KEY = process.env.EXA_API_KEY || '';
if (!EXA_API_KEY) {
  throw new Error('EXA_API_KEY is not defined');
}

const exa = new Exa(EXA_API_KEY);

export interface NewsSource {
  name: string;
  domain: string;
}

export const NEWS_SOURCES: NewsSource[] = [
  { name: 'Bloomberg', domain: 'bloomberg.com' },
  { name: 'Wall Street Journal', domain: 'wsj.com' },
  { name: 'New York Times', domain: 'nytimes.com' },
  { name: 'Associated Press', domain: 'apnews.com' }
];

export interface NewsSourceResult {
  source: string;
  articles: {
    title: string;
    url: string;
    text: string;
    summary: string;
    publishedDate: string;
  }[];
}

export async function searchNews(source: NewsSource): Promise<NewsSourceResult> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const dateString = oneWeekAgo.toISOString().split('T')[0];

  try {
    // Simple direct search for recent articles
    const searchResponse = await exa.searchAndContents(
      `site:${source.domain} news`,
      {
        numResults: 5,
        text: true,
        startPublishedDate: dateString
      }
    );

    if (!searchResponse || !searchResponse.results) {
      throw new Error('Invalid search response from Exa');
    }

    const articles = searchResponse.results.map(result => {
      // Create a summary by taking roughly the first 50 words
      const words = (result.text || '').split(' ');
      const summary = words.slice(0, 50).join(' ') + (words.length > 50 ? '...' : '');

      return {
        title: result.title || 'Untitled',
        url: result.url,
        text: result.text || '',
        summary,
        publishedDate: result.publishedDate || dateString
      };
    });

    return {
      source: source.name,
      articles
    };

  } catch (error) {
    console.error(`Error fetching news from ${source.name}:`, error);
    throw error;
  }
}

export async function fetchAllNews() {
  const results = await Promise.all(
    NEWS_SOURCES.map(source => searchNews(source))
  );
  return results;
}
