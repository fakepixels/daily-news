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

// Cache for OpenAI summaries to avoid regenerating for the same content
const summaryCache = new Map<string, { summary: string; timestamp: number }>();
const SUMMARY_CACHE_TTL = 3600000; // 1 hour in milliseconds

async function getCachedSummary(title: string, content: string | null): Promise<string> {
  const cacheKey = `${title}-${content ? content.slice(0, 100) : ''}`; // Use title + start of content as cache key
  const cached = summaryCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < SUMMARY_CACHE_TTL) {
    return cached.summary;
  }

  try {
    const summaryResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a tech news summarizer. Create a concise 2-sentence summary (exactly 50 words) of the article. First sentence should state the main news. Second sentence should explain the significance or impact. Be specific with numbers, names, and facts. Never use phrases like 'the article discusses' or 'according to'."
        },
        {
          role: "user",
          content: `Title: ${title}\n\nContent: ${content || title}`
        }
      ],
      max_tokens: 100,
      temperature: 0.3
    });

    const summary = summaryResponse.choices[0].message.content || '';
    summaryCache.set(cacheKey, { summary, timestamp: Date.now() });
    return summary;
  } catch (error) {
    console.error('Error generating summary:', error);
    // Return a fallback summary based on the title
    return `${title}. This news could have significant implications for the tech industry.`;
  }
}

// Helper function to clean article text
export function cleanArticleText(text: string): string {
  if (!text) return '';
  
  const cleanText = text
    .replace(/\n+/g, ' ')  // Replace multiple newlines with space
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/Need help\? Contact us.*?not a robot\./g, '')  // Remove paywall text
    .replace(/Why did this happen\?.*$/, '')  // Remove error messages
    .replace(/©.*?\d{4}.*?$/g, '')  // Remove copyright notices
    .replace(/Share this article.*$/g, '')  // Remove share buttons text
    .replace(/^.*?(?=\w{10,})/g, '')  // Remove short prefix fragments
    .replace(/Subscribe to continue reading.*$/g, '') // Remove subscription prompts
    .replace(/Already a subscriber\?.*$/g, '') // Remove subscriber messages
    .replace(/Sign up for.*$/g, '') // Remove signup prompts
    .replace(/Follow us on.*$/g, '') // Remove social media prompts
    .replace(/Read more:.*$/g, '') // Remove read more links
    .replace(/Related:.*$/g, '') // Remove related article links
    .trim();

  // If the text is too short after cleaning, it might be a navigation page
  if (cleanText.length < 100) {
    return '';
  }

  return cleanText;
}

// Helper function to check if title is a section header or navigation
export function isSectionHeader(title: string): boolean {
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
    /^Threads:$/i,
    /^Gaming$/i,
    /^Gaming -/i,
    /^Cybersecurity$/i,
    /^AI$/i,
    /^Big Tech$/i,
    /^Consumer Tech$/i,
    /^Startups$/i,
    /^Screentime$/i,
    /^Markets$/i,
    /^Economics$/i,
    /^Industries$/i,
    /^Politics$/i,
    /^Opinion$/i,
    /^Bloomberg$/i,
    /^Menu$/i,
    /^Subscribe$/i,
    /^Press Releases/i,
    /^AP News$/i,
    /^AP Top News$/i,
    /^AP Business News$/i,
    /^AP Technology News$/i,
    /^Home$/i,
    /^News$/i,
    /^Business$/i,
    /^About Us$/i,
    /^Contact$/i,
    /^Help$/i,
    /^Support$/i,
    /^Terms$/i,
    /^Privacy$/i,
    /^Cookie Policy$/i,
    /^Sitemap$/i
  ];
  
  // Check if the title matches any of the patterns
  if (sectionPatterns.some(pattern => pattern.test(title))) {
    return true;
  }
  
  // Additional checks for common non-headline patterns
  if (
    title.includes(' - AP News') || // Catches "Press Releases - AP News" and similar
    title.includes('| AP News') ||
    title.length < 20 || // Very short titles are likely navigation
    /^[^a-zA-Z]*$/.test(title) || // Titles with no letters
    /^(The|A|An) [A-Z][a-z]+ Page$/i.test(title) || // "The Something Page"
    /^[A-Z\s]+$/.test(title) // All uppercase titles are usually sections
  ) {
    return true;
  }
  
  return false;
}

// Helper function to get source-specific search query
function getSearchQuery(source: NewsSource, category: 'TECH' | 'FINANCE' = 'TECH'): string {
  const techTerms = '(technology OR tech OR AI OR artificial intelligence OR software OR startup OR cybersecurity)';
  const financeTerms = '(finance OR financial OR banking OR investment OR "stock market" OR cryptocurrency OR fintech OR economy OR markets OR stocks OR bonds OR trading)';
  const baseTerms = category === 'TECH' ? techTerms : financeTerms;
  
  switch (source.domain) {
    case 'techcrunch.com':
      return category === 'TECH' 
        ? `site:${source.domain}/2024` 
        : `site:${source.domain} ${financeTerms}`;
    case 'bloomberg.com':
      return category === 'TECH'
        ? `site:${source.domain} ${baseTerms} -"Bloomberg the Company"`
        : `site:${source.domain}/news/articles OR site:${source.domain}/markets OR site:${source.domain}/economics OR site:${source.domain}/business -"Bloomberg the Company"`;
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
  sourceUrl?: string; // Optional URL for custom sources
  articles: {
    title: string;
    url: string;
    text: string;
    summary: string;
    publishedDate: string;
    id: string;
  }[];
  error?: string;
}

export async function searchNews(source: NewsSource, category: 'TECH' | 'FINANCE' = 'TECH'): Promise<NewsSourceResult> {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const dateString = oneWeekAgo.toISOString().split('T')[0];

  try {
    const searchResponse = await exa.searchAndContents(
      getSearchQuery(source, category),
      {
        numResults: 30, // Increased for more potential results
        text: true,
        startPublishedDate: dateString,
        useAuthorExtraction: true,
        useBodyExtraction: true
      }
    );

    if (!searchResponse || !searchResponse.results) {
      throw new Error('Invalid search response from Exa');
    }

    // Filter and sort results
    const validResults = searchResponse.results
      .filter(result => {
        // Ensure we have a valid title and date
        if (!result.title || !result.publishedDate || isSectionHeader(result.title)) {
          return false;
        }
        
        // Ensure we have actual article content
        const text = result.text || '';
        if (text.length < 200) {
          return false;
        }

        // Skip articles that are just navigation or section pages
        if (text.includes('Bloomberg the Company & Its Products') || 
            text.includes('Bloomberg Terminal Demo Request') ||
            text.includes('Bloomberg Anywhere Remote Login')) {
          return false;
        }

        // For Bloomberg, validate articles based on category
        if (source.domain === 'bloomberg.com') {
          if (category === 'TECH') {
            const isValidTechArticle = result.url.includes('/technology/') || 
                                     result.url.includes('/tech/') ||
                                     result.url.includes('/news/articles/') ||
                                     /\b(AI|software|tech|startup|cyber|bitcoin|crypto)\b/i.test(result.title);
            if (!isValidTechArticle) {
              return false;
            }
          } else if (category === 'FINANCE') {
            const isValidFinanceArticle = result.url.includes('/markets/') ||
                                        result.url.includes('/finance/') ||
                                        result.url.includes('/business/') ||
                                        result.url.includes('/economics/') ||
                                        result.url.includes('/news/articles/') ||
                                        /\b(market|stock|finance|bank|invest|trade|economy|fund|bond|equity|nasdaq|dow|sp500|s&p|rate|fed|treasury)\b/i.test(result.title);
            if (!isValidFinanceArticle) {
              return false;
            }
          }
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.publishedDate || '');
        const dateB = new Date(b.publishedDate || '');
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 6);

    if (validResults.length === 0) {
      console.warn(`No valid results found for ${source.name}`);
    }

    const articles = await Promise.all(validResults.map(async (result, index) => {
      const cleanText = cleanArticleText(result.text || '');
      
      // For Bloomberg articles, ensure we're getting the actual article content
      let contentToSummarize = cleanText;
      if (source.domain === 'bloomberg.com') {
        // Try to get content after (Bloomberg) marker, if not found use the whole text
        const bloombergMatch = cleanText.match(/\([Bb]loomberg\).*$/);
        contentToSummarize = bloombergMatch ? bloombergMatch[0].replace(/\([Bb]loomberg\)/, '').trim() : cleanText;
        
        // Remove common Bloomberg boilerplate
        contentToSummarize = contentToSummarize
          .replace(/For more articles like this.*$/i, '')
          .replace(/To contact the (reporter|editor|author).*$/i, '')
          .replace(/\(Updates with.*?\)/i, '')
          .replace(/--With assistance from.*$/i, '');
      }
      // Get summary from cache or generate new one
      const summary = await getCachedSummary(result.title || '', contentToSummarize);

      // Generate a unique ID for each article
      const uniqueId = `${source.name}-${index}-${result.url.split('/').pop()}`;

      return {
        title: result.title || 'Untitled',
        url: result.url,
        text: cleanText,
        summary,
        publishedDate: result.publishedDate || dateString,
        id: uniqueId
      };
    }));

    return {
      source: source.name,
      articles
    };

  } catch (error) {
    console.error(`Error fetching news from ${source.name}:`, error);
    return {
      source: source.name,
      error: error instanceof Error ? error.message : 'Failed to fetch news',
      articles: []
    };
  }
}

export async function fetchAllNews(customSources: string[] = [], category: 'TECH' | 'FINANCE' = 'TECH'): Promise<NewsSourceResult[]> {
  const results: NewsSourceResult[] = [];
  const processedDomains = new Set<string>();

  // Process default sources
  for (const source of NEWS_SOURCES) {
    try {
      processedDomains.add(source.domain);
      const result = await searchNews(source, category);
      results.push(result);
    } catch (error) {
      console.error(`Error fetching news from ${source.name}:`, error);
      results.push({
        source: source.name,
        articles: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  // Process custom sources (deduplicated)
  const uniqueCustomSources = customSources.filter((sourceUrl) => {
    try {
      const url = new URL(sourceUrl);
      const domain = url.hostname.replace('www.', '');
      if (processedDomains.has(domain)) {
        return false;
      }
      processedDomains.add(domain);
      return true;
    } catch {
      return false;
    }
  });

  for (const sourceUrl of uniqueCustomSources) {
    try {
      const url = new URL(sourceUrl);
      const domain = url.hostname.replace('www.', '');
      const source: NewsSource = {
        name: domain,
        domain: domain
      };
      
      const result = await searchNews(source, category);
      results.push({
        ...result,
        source: `Custom: ${source.name}`,
        sourceUrl // Add the source URL to make the key unique
      });
    } catch (error) {
      console.error(`Error fetching news from custom source ${sourceUrl}:`, error);
      results.push({
        source: `Custom: ${sourceUrl}`,
        sourceUrl,
        articles: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    }
  }

  return results;
}
