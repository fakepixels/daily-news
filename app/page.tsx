'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useTheme } from 'next-themes';
import { Sun, Moon, Check, Search, X, Plus, Info, ExternalLink } from 'lucide-react';
import type { NewsSourceResult } from './types/news';

interface SearchResult {
  id: string;
  title: string;
  url: string;
  publishedDate: string;
  summary: string;
  source: string;
}

function SearchBar({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: query.trim() }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to search news');
      }
      
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex flex-col z-50 sm:items-center sm:justify-center">
      <div className="bg-white dark:bg-gray-900 w-full sm:w-auto sm:rounded-xl sm:max-w-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] mt-auto sm:mt-0 sm:mx-4">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder="Search for news..."
            className="flex-1 bg-transparent font-geist placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none text-base"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-1.5 bg-[#6a4ce1] text-white text-sm rounded-full hover:bg-[#5a3dd1] disabled:opacity-50 transition-colors font-geist font-medium min-w-[80px]"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg font-geist text-sm">
              {error}
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-4">
              {results.map((article) => (
                <div
                  key={article.id}
                  className="border border-gray-100 dark:border-gray-800 rounded-lg p-4 bg-white dark:bg-gray-900"
                >
                  <div className="text-xs text-[#6a4ce1] dark:text-[#8e75ed] font-medium mb-1.5 font-geist">
                    {article.source}
                  </div>
                  <h3 className="font-semibold mb-1.5 font-geist text-sm">
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#6a4ce1] dark:hover:text-[#8e75ed] transition-colors"
                    >
                      {article.title}
                    </a>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 font-geist">
                    {new Date(article.publishedDate).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 font-geist text-sm">
                    {article.summary}
                  </p>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && !loading && !error && query && (
            <div className="text-center text-gray-500 dark:text-gray-400 font-geist py-8 text-sm">
              No results found
            </div>
          )}

          {!query && !loading && !error && (
            <div className="text-center text-gray-500 dark:text-gray-400 font-geist py-8 text-sm">
              Start typing to search for news
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddSourceModal({ onClose, onAdd, existingSources }: { 
  onClose: () => void; 
  onAdd: (url: string) => void;
  existingSources: string[];
}) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!url.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const newUrl = new URL(url.trim());
      const domain = newUrl.hostname.replace('www.', '');
      
      if (existingSources.some(source => {
        try {
          const existingUrl = new URL(source);
          return existingUrl.hostname.replace('www.', '') === domain;
        } catch {
          return false;
        }
      })) {
        setError('This news source has already been added');
        return;
      }

      onAdd(url.trim());
      onClose();
    } catch {
      setError('Please enter a valid URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 flex flex-col z-50 sm:items-center sm:justify-center">
      <div className="bg-white dark:bg-gray-900 w-full sm:w-auto sm:rounded-xl sm:max-w-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] mt-auto sm:mt-0 sm:mx-4">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            placeholder="Enter news feed URL..."
            className="flex-1 bg-transparent font-geist placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none text-base"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={loading}
            className="px-4 py-1.5 bg-[#6a4ce1] text-white text-sm rounded-full hover:bg-[#5a3dd1] disabled:opacity-50 transition-colors font-geist font-medium min-w-[80px]"
          >
            {loading ? 'Adding...' : 'Add'}
          </button>
        </div>

        <div className="p-4">
          {error && (
            <div className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg font-geist text-sm">
              {error}
            </div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">⚠️ Please note: A brand new source may not have been filtered and curated.</p>
            <p>Make sure to add a valid RSS feed URL for the news source you want to follow.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
      ) : (
        <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
      )}
    </button>
  );
}

function ExplainModal({ 
  onClose, 
  title, 
  summary 
}: { 
  onClose: () => void;
  title: string;
  summary: string;
}) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExplanation = async () => {
      try {
        const response = await fetch('/api/explain', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, summary }),
        });
        
        if (!response.ok) {
          throw new Error('Failed to get explanation');
        }
        
        const data = await response.json();
        setExplanation(data.explanation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchExplanation();
  }, [title, summary]);

  return (
    <div className="fixed inset-0 bg-black/30 flex flex-col z-50 sm:items-center sm:justify-center">
      <div className="bg-white dark:bg-gray-900 w-full sm:w-auto sm:rounded-xl sm:max-w-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] mt-auto sm:mt-0 sm:mx-4">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold font-geist flex-1">Why This Matters</h2>
        </div>

        <div className="p-6">
          <h3 className="font-semibold mb-4 font-geist">{title}</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#6a4ce1]" />
            </div>
          ) : error ? (
            <div className="text-red-500 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg font-geist text-sm">
              {error}
            </div>
          ) : (
            <p className="text-gray-700 dark:text-gray-300 font-geist text-sm leading-relaxed">
              {explanation}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleModal({ 
  onClose, 
  article 
}: { 
  onClose: () => void;
  article: {
    title: string;
    summary: string;
    url: string;
    publishedDate: string;
  };
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex flex-col z-50 sm:items-center sm:justify-center">
      <div className="bg-white dark:bg-gray-900 w-full sm:w-auto sm:rounded-xl sm:max-w-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] mt-auto sm:mt-0 sm:mx-4">
        <div className="flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold font-geist">{article.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-geist">
              {new Date(article.publishedDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
          <a
            href={article.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-full transition-colors text-[#6a4ce1] dark:text-[#8e75ed]"
            aria-label="Open original article"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>

        <div className="p-6">
          <div className="font-geist text-base leading-relaxed text-gray-700 dark:text-gray-300">
            {article.summary}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [category, setCategory] = useState<'TECH' | 'FINANCE'>('TECH');
  const [isHovering, setIsHovering] = useState(false);
  const [readArticles, setReadArticles] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readArticles');
      return new Set(saved ? JSON.parse(saved) : []);
    }
    return new Set();
  });
  const [showSearch, setShowSearch] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<{ title: string; summary: string } | null>(null);
  const [customSources, setCustomSources] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customSources');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [showArticle, setShowArticle] = useState(false);
  const [selectedFullArticle, setSelectedFullArticle] = useState<{
    title: string;
    summary: string;
    url: string;
    publishedDate: string;
  } | null>(null);

  // Save readArticles to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('readArticles', JSON.stringify([...readArticles]));
    }
  }, [readArticles]);

  // Save customSources to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('customSources', JSON.stringify(customSources));
    }
  }, [customSources]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetcher = async ([url, currentCategory]: [string, string]) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customSources, category: currentCategory }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch news');
    }
    return res.json();
  };

  const { data: news, error, isLoading, mutate } = useSWR<NewsSourceResult[]>(
    ['/api/news', category],
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval: 300000, // Refresh every 5 minutes
    }
  );

  // Function to handle source removal
  const handleRemoveSource = (sourceUrl: string) => {
    // Update customSources in localStorage
    setCustomSources(prev => prev.filter(url => url !== sourceUrl));
    
    // Immediately update the UI by filtering out the removed source
    if (news) {
      mutate(
        news.filter(source => source.sourceUrl !== sourceUrl),
        false // Set to false to avoid revalidation
      );
    }
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="fixed top-0 right-0 left-0 z-40 flex justify-end p-2 sm:p-4 bg-gradient-to-b from-white dark:from-gray-900 to-transparent">
        <div className="flex gap-1.5 sm:gap-2 items-center">
          <button
            type="button"
            onClick={() => setShowAddSource(true)}
            className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
            aria-label="Add news source"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="p-1.5 sm:p-2 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
            aria-label="Search news"
          >
            <Search className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <ThemeToggle />
        </div>
      </div>

      {showSearch && (
        <SearchBar onClose={() => setShowSearch(false)} />
      )}

      {showAddSource && (
        <AddSourceModal 
          onClose={() => setShowAddSource(false)} 
          onAdd={(url) => {
            setCustomSources(prev => [...prev, url]);
          }}
          existingSources={customSources}
        />
      )}

      {showExplain && selectedArticle && (
        <ExplainModal
          onClose={() => {
            setShowExplain(false);
            setSelectedArticle(null);
          }}
          title={selectedArticle.title}
          summary={selectedArticle.summary}
        />
      )}

      {showArticle && selectedFullArticle && (
        <ArticleModal
          onClose={() => {
            setShowArticle(false);
            setSelectedFullArticle(null);
          }}
          article={selectedFullArticle}
        />
      )}

      <header className="text-center mb-16 pt-16">
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-bold mb-4">
          DAILY{' '}
          <button
            type="button"
            className={`relative cursor-pointer transition-colors duration-300 bg-transparent border-none font-inherit ${
              isHovering ? 'text-[#6a4ce1] dark:text-[#8e75ed]' : ''
            }`}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => {
              setCategory(prev => prev === 'TECH' ? 'FINANCE' : 'TECH');
              mutate(); // Refetch news when category changes
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                setCategory(prev => prev === 'TECH' ? 'FINANCE' : 'TECH');
                mutate(); // Refetch news when category changes
              }
            }}
          >
            {category}
          </button>
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
          {currentTime.toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          })} - built by{' '}
          <a 
            href="https://twitter.com/fkpxls" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[#6a4ce1] dark:text-[#8e75ed] hover:underline"
          >
            @fkpxls
          </a>
        </p>
      </header>

      <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mb-16" />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6a4ce1] mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400 font-geist">Fetching {category.toLowerCase()} news...</p>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-20">
          <div>
            <h2 className="text-xl font-bold mb-2">Error Loading News</h2>
            <p className="mb-4">{error}</p>
            <button
              type="button"
              onClick={() => mutate()}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      ) : news?.map((source) => (
        <div key={source.sourceUrl || source.source} className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">{source.source}</h2>
            {source.source.startsWith('Custom:') && (
              <button
                type="button"
                onClick={() => {
                  if (source.sourceUrl) {
                    handleRemoveSource(source.sourceUrl);
                  }
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
              >
                <X className="h-4 w-4" />
                <span>Remove source</span>
              </button>
            )}
          </div>
          {source.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
              <p className="font-medium">Unable to load articles</p>
              <p className="text-sm">{source.error}</p>
            </div>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {source.articles.map((article) => {
                const isRead = readArticles.has(article.id);
                return (
                  <div key={article.id} className="h-[280px]">
                    <button
                      type="button"
                      onClick={() => {
                        const newSet = new Set(readArticles);
                        newSet.add(article.id);
                        setReadArticles(newSet);
                        setSelectedFullArticle({
                          title: article.title,
                          summary: article.summary,
                          url: article.url,
                          publishedDate: article.publishedDate,
                        });
                        setShowArticle(true);
                      }}
                      className="w-full h-full text-left"
                    >
                      <article 
                        className={`w-full h-full border dark:border-gray-700 rounded-lg p-6 pt-12 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group relative ${
                          isRead ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
                        }`}
                      >
                        {isRead && (
                          <div className="absolute top-3 right-3 flex items-center text-green-500 text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            <Check className="h-3.5 w-3.5 mr-1" />
                            <span className="text-xs font-medium">Read</span>
                          </div>
                        )}
                        <div className="absolute top-3 left-3 flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedArticle({
                                title: article.title,
                                summary: article.summary
                              });
                              setShowExplain(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-[#6a4ce1] dark:text-gray-500 dark:hover:text-[#8e75ed] transition-colors"
                            aria-label="Why this matters"
                          >
                            <Info className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="flex flex-col flex-grow min-h-0">
                          <h3 className="font-semibold mb-2 line-clamp-2">
                            <a
                              href={article.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className={`${
                                isRead 
                                  ? 'text-gray-500 dark:text-gray-400' 
                                  : 'text-gray-900 dark:text-gray-100 group-hover:text-[#6a4ce1] dark:group-hover:text-[#8e75ed]'
                              } transition-colors duration-300`}
                            >
                              {article.title}
                            </a>
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                            {new Date(article.publishedDate).toLocaleDateString()}
                          </p>
                          <p className={`line-clamp-3 text-sm ${
                            isRead 
                              ? 'text-gray-500 dark:text-gray-500' 
                              : 'text-gray-700 dark:text-gray-300'
                          }`}>
                            {article.summary}
                          </p>
                        </div>
                      </article>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
