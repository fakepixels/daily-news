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
    /^Subscribe$/i
  ];
  return sectionPatterns.some(pattern => pattern.test(title));
}

// Helper function to get source-specific search query
function getSearchQuery(source: NewsSource): string {
  const baseTerms = '(technology OR tech OR AI OR artificial intelligence OR software OR startup OR cybersecurity)';
  
  switch (source.domain) {
    case 'techcrunch.com':
      return `site:${source.domain}/2024`; // Focus on recent articles
    case 'bloomberg.com':
      // Include both technology section and tech-related articles from other sections
      return `site:${source.domain} (technology OR tech OR AI OR artificial intelligence OR software OR startup OR cybersecurity) -"Bloomberg the Company"`; 
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
    id: string;
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

        // For Bloomberg, accept articles from technology section or with tech-related content
        if (source.domain === 'bloomberg.com') {
          const isValidArticle = result.url.includes('/technology/') || 
                                result.url.includes('/tech/') ||
                                result.url.includes('/news/articles/') ||
                                /\b(AI|software|tech|startup|cyber|bitcoin|crypto)\b/i.test(result.title);
          if (!isValidArticle) {
            return false;
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

      // Generate a clean summary using GPT
      const summaryResponse = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a tech news summarizer. Create a concise 2-sentence summary (exactly 50 words) of the article. First sentence should state the main news. Second sentence should explain the significance or impact. Be specific with numbers, names, and facts. Never use phrases like 'the article discusses' or 'according to'."
          },
          {
            role: "user",
            content: `Title: ${result.title}\n\nContent: ${contentToSummarize}`
          }
        ],
        max_tokens: 100,
        temperature: 0.3
      });

      const summary = summaryResponse.choices[0].message.content || '';

      // Generate a unique ID for each article
      const uniqueId = `${source.name}-${index}-${result.url.split('/').pop()}`;

      return {
        title: result.title || 'Untitled',
        url: result.url,
        text: cleanText,
        summary,
        publishedDate: result.publishedDate || dateString,
        id: uniqueId // Add a unique ID field
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
