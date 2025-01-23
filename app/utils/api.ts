import Exa from 'exa-js';
import OpenAI from 'openai';

const EXA_API_KEY = process.env.EXA_API_KEY || '';
if (!EXA_API_KEY) {
  throw new Error('EXA_API_KEY is not defined');
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is not defined');
}

const exa = new Exa(EXA_API_KEY);
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// Helper function to clean article text
function cleanArticleText(text: string): string {
  const cleanText = text
    .replace(/\n+/g, ' ')  // Replace multiple newlines with space
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/Need help\? Contact us.*?not a robot\./g, '')  // Remove paywall text
    .replace(/Bloomberg Daybreak.*?listeners with/g, '')  // Remove Bloomberg boilerplate
    .replace(/Why did this happen\?.*$/, '')  // Remove error messages
    .trim();

  return cleanText.trim();
}

// Helper function to check if title is a section header
function isSectionHeader(title: string): boolean {
  const sectionPatterns = [
    /^Latest News$/i,
    /^Research and Analysis$/i,
    /^Tech News$/i,
    /- Latest Headlines$/i,
    /^Technology$/i,
    /^Technology - Bloomberg$/i,
    /^Top News$/i,
    /^More:$/i,
    /^Forums:$/i,
    /^Threads:$/i
  ];
  return sectionPatterns.some(pattern => pattern.test(title));
}

// Helper function to get source-specific search query
function getSearchQuery(source: NewsSource): string {
  const baseTerms = '(technology OR tech OR AI OR artificial intelligence OR software OR startup OR cybersecurity)';
  
  switch (source.domain) {
    case 'techcrunch.com':
      return `site:${source.domain}/2024`; // Focus on recent articles
    default:
      return `site:${source.domain} ${baseTerms}`;
  }
}

export interface NewsSource {
  name: string;
  domain: string;
}

export const NEWS_SOURCES: NewsSource[] = [
  { name: 'Bloomberg', domain: 'bloomberg.com' },
  { name: 'TechCrunch', domain: 'techcrunch.com' },
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
    const searchResponse = await exa.searchAndContents(
      getSearchQuery(source),
      {
        numResults: 15,
        text: true,
        startPublishedDate: dateString
      }
    );

    if (!searchResponse || !searchResponse.results) {
      throw new Error('Invalid search response from Exa');
    }

    // Filter and sort results
    const validResults = searchResponse.results
      .filter(result => result.title && result.publishedDate && !isSectionHeader(result.title))
      .sort((a, b) => {
        const dateA = new Date(a.publishedDate || '');
        const dateB = new Date(b.publishedDate || '');
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);

    if (validResults.length === 0) {
      console.warn(`No valid results found for ${source.name}`);
    }

    const articles = await Promise.all(validResults.map(async result => {
      const cleanText = cleanArticleText(result.text || '');

      // Generate a clean summary using GPT
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "Summarize technology news articles in exactly 50 words. Focus on technical details, business impact, and industry implications. End with a complete sentence and a period. Never use ellipsis. Never ask questions or add conversational phrases. Never mention that you're an AI or helper."
          },
          {
            role: "user",
            content: cleanText
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      });

      const summary = summaryResponse.choices[0].message.content || '';

      return {
        title: result.title || 'Untitled',
        url: result.url,
        text: cleanText,
        summary,
        publishedDate: result.publishedDate || dateString
      };
    }));

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
