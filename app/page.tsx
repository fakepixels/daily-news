'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { useTheme } from 'next-themes';
import { Sun, Moon, ChevronLeft, ChevronRight, Check, Search, X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/30 flex flex-col z-50 sm:items-center sm:justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white dark:bg-gray-900 w-full sm:w-auto sm:rounded-xl sm:max-w-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] mt-auto sm:mt-0 sm:mx-4"
      >
        {/* Search Header */}
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
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              'Search'
            )}
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg font-geist text-sm"
              >
                {error}
              </motion.div>
            )}

            {results.length > 0 && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                {results.map((article, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
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
                      {new Date(article.publishedDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 font-geist text-sm leading-relaxed">
                      {article.summary}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {results.length === 0 && !loading && !error && query && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-gray-500 dark:text-gray-400 font-geist py-8 text-sm"
              >
                No results found
              </motion.div>
            )}

            {!query && !loading && !error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-gray-500 dark:text-gray-400 font-geist py-8 text-sm"
              >
                Start typing to search for news
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
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
      
      // Check if the domain already exists in existing sources
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/30 flex flex-col z-50 sm:items-center sm:justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div 
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white dark:bg-gray-900 w-full sm:w-auto sm:rounded-xl sm:max-w-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh] mt-auto sm:mt-0 sm:mx-4"
      >
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
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            ) : (
              'Add'
            )}
          </button>
        </div>

        <div className="p-4">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-red-500 mb-4 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg font-geist text-sm"
            >
              {error}
            </motion.div>
          )}
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="mb-2">⚠️ Please note: A brand new source may not have been filtered and curated.</p>
            <p>Make sure to add a valid RSS feed URL for the news source you want to follow.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
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
      className="p-2 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}

function ArticleModal({ 
  article, 
  onClose,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  direction
}: { 
  article: { title: string; publishedDate: string; summary: string; url: string; sourceIndex?: number; }; 
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  direction: number;
}) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  const handleOverlayClick = (e: React.MouseEvent | React.KeyboardEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getExplanation = async () => {
    setLoadingExplanation(true);
    try {
      const response = await fetch('/api/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: article.title,
          summary: article.summary,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to get explanation');
      
      const data = await response.json();
      setExplanation(data.explanation);
    } catch {
      setExplanation('Sorry, we could not generate an explanation at this time.');
    } finally {
      setLoadingExplanation(false);
      setShowExplanation(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && hasNext) {
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrevious) {
        onPrevious();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrevious, onClose, hasNext, hasPrevious]);

  const overlayVariants = {
    closed: {
      opacity: 0,
      backdropFilter: "blur(0px)"
    },
    open: {
      opacity: 1,
      backdropFilter: "blur(4px)"
    }
  };

  const modalVariants = {
    closed: {
      scale: 0.8,
      opacity: 0
    },
    open: {
      scale: 1,
      opacity: 1
    }
  };

  const contentVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95
    })
  };

  const Content = () => (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={`p-2 rounded-full ${hasPrevious ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'}`}
          aria-label="Previous article"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext}
          className={`p-2 rounded-full ${hasNext ? 'hover:bg-gray-100 dark:hover:bg-gray-700' : 'opacity-50 cursor-not-allowed'}`}
          aria-label="Next article"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      </div>
      <h2 className="text-2xl font-bold mb-4">{article.title}</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold text-[#6a4ce1] dark:text-[#8e75ed]">What?</h3>
          <p className="text-gray-700 dark:text-gray-300">{article.summary}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-[#6a4ce1] dark:text-[#8e75ed]">When?</h3>
          <p className="text-gray-700 dark:text-gray-300">
            {new Date(article.publishedDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </div>
        
        <div>
          <h3 className="font-semibold text-[#6a4ce1] dark:text-[#8e75ed]">Why?</h3>
          {!showExplanation ? (
            <button
              type="button"
              onClick={getExplanation}
              disabled={loadingExplanation}
              className="px-4 py-2 bg-[#6a4ce1] text-white rounded hover:bg-[#5a3dd1] transition-colors disabled:opacity-50"
            >
              {loadingExplanation ? 'Brewing a hot take...' : 'Get the hot take'}
            </button>
          ) : (
            <p className="text-gray-700 dark:text-gray-300">
              {explanation}
            </p>
          )}
        </div>
      </div>
      
      <div className="mt-6">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block bg-[#6a4ce1] text-white px-4 py-2 rounded hover:bg-[#5a3dd1] transition-colors"
        >
          Read full article
        </a>
      </div>
    </div>
  );

  return (
    <motion.div
      initial="closed"
      animate="open"
      variants={overlayVariants}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 w-full h-full"
      onClick={handleOverlayClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        handleOverlayClick(e);
      }}
      transition={{ duration: 0.2 }}
    >
      <motion.div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl relative"
        variants={modalVariants}
        initial="closed"
        animate="open"
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25
        }}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.div
            key={`${article.sourceIndex}-${direction}`}
            variants={contentVariants}
            initial="enter"
            animate="center"
            exit="exit"
            custom={direction}
            transition={{
              x: { type: "spring", stiffness: 400, damping: 30 },
              opacity: { duration: 0.15 },
              scale: { type: "spring", stiffness: 400, damping: 25 }
            }}
          >
            <Content />
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function Home() {
  const [direction, setDirection] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [readArticles, setReadArticles] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('readArticles');
      return new Set(saved ? JSON.parse(saved) : []);
    }
    return new Set();
  });
  const [showSearch, setShowSearch] = useState(false);
  const [showAddSource, setShowAddSource] = useState(false);
  const [customSources, setCustomSources] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('customSources');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

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

  const fetcher = async (url: string) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customSources }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to fetch news');
    }
    return res.json();
  };

  const { data: news, error, isLoading } = useSWR<NewsSourceResult[]>('/api/news', fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 300000, // Refresh every 5 minutes
  });
  const [selectedArticle, setSelectedArticle] = useState<null | {
    id: string;
    title: string;
    publishedDate: string;  
    summary: string;
    url: string;
    sourceIndex: number;
    articleIndex: number;
  }>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer); // Cleanup on unmount
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6a4ce1]" />
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="text-red-500 text-center min-h-screen flex items-center justify-center">
        <div>
          <h2 className="text-xl font-bold mb-2">Error Loading News</h2>
          <p className="mb-4">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="fixed top-0 right-0 left-0 z-40 flex justify-end p-4 bg-gradient-to-b from-white dark:from-gray-900 to-transparent">
        <div className="flex gap-2 items-center">
          <button
            type="button"
            onClick={() => setShowAddSource(true)}
            className="p-2 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
            aria-label="Add news source"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setShowSearch(true)}
            className="p-2 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border border-gray-100 dark:border-gray-800"
            aria-label="Search news"
          >
            <Search className="h-5 w-5" />
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

      <header className="text-center mb-16 pt-16">
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-9xl font-bold mb-4">DAILY TECH NEWS</h1>
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
      {news.map((source) => (
        <div key={source.sourceUrl || source.source} className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold tracking-tight">{source.source}</h2>
            {source.source.startsWith('Custom:') && (
              <button
                type="button"
                onClick={() => {
                  if (source.sourceUrl) {
                    setCustomSources(prev => prev.filter(url => url !== source.sourceUrl));
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
                  <div key={article.id}>
                    <button 
                      type="button"
                      onClick={() => {
                        const sourceIndex = news.findIndex(s => s.source === source.source);
                        const articleIndex = source.articles.findIndex(a => a.id === article.id);
                        setSelectedArticle({
                          ...article,
                          sourceIndex,
                          articleIndex
                        });
                      }}
                      className={`w-full text-left border dark:border-gray-700 rounded-lg p-6 pt-12 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer h-full flex flex-col group relative ${
                        isRead ? 'bg-gray-50 dark:bg-gray-900' : 'bg-white dark:bg-gray-800'
                      }`}
                    >
                      {isRead && (
                        <div className="absolute top-3 right-3 flex items-center text-green-500 text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          <Check className="h-3.5 w-3.5 mr-1" />
                          <span className="text-xs font-medium">Read</span>
                        </div>
                      )}
                      <h3 className="font-semibold mb-2">
                        <span className={`${
                          isRead 
                            ? 'text-gray-500 dark:text-gray-400' 
                            : 'text-gray-900 dark:text-gray-100 group-hover:text-[#6a4ce1] dark:group-hover:text-[#8e75ed]'
                        } transition-colors duration-300`}>
                          {article.title}
                        </span>
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                        {new Date(article.publishedDate).toLocaleDateString()}
                      </p>
                      <p className={`line-clamp-3 flex-grow ${
                        isRead 
                          ? 'text-gray-500 dark:text-gray-500' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {article.summary}
                      </p>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {selectedArticle && (
        <ArticleModal
          key={`${selectedArticle.sourceIndex}-${selectedArticle.articleIndex}`}
          article={selectedArticle}
          onClose={() => {
            const newSet = new Set(readArticles);
            newSet.add(selectedArticle.id);
            setReadArticles(newSet);
            setSelectedArticle(null);
          }}
          onNext={() => {
            const newSet = new Set(readArticles);
            newSet.add(selectedArticle.id);
            setReadArticles(newSet);
            const currentSource = news[selectedArticle.sourceIndex];
            if (selectedArticle.articleIndex < currentSource.articles.length - 1) {
              const nextArticle = currentSource.articles[selectedArticle.articleIndex + 1];
              setDirection(1);
              setSelectedArticle({
                ...nextArticle,
                sourceIndex: selectedArticle.sourceIndex,
                articleIndex: selectedArticle.articleIndex + 1
              });
            } else if (selectedArticle.sourceIndex < news.length - 1) {
              const nextSource = news[selectedArticle.sourceIndex + 1];
              if (nextSource.articles && nextSource.articles.length > 0) {
                setDirection(1);
                setSelectedArticle({
                  ...nextSource.articles[0],
                  sourceIndex: selectedArticle.sourceIndex + 1,
                  articleIndex: 0
                });
              }
            }
          }}
          onPrevious={() => {
            const newSet = new Set(readArticles);
            newSet.add(selectedArticle.id);
            setReadArticles(newSet);
            if (selectedArticle.articleIndex > 0) {
              const currentSource = news[selectedArticle.sourceIndex];
              const prevArticle = currentSource.articles[selectedArticle.articleIndex - 1];
              setDirection(-1);
              setSelectedArticle({
                ...prevArticle,
                sourceIndex: selectedArticle.sourceIndex,
                articleIndex: selectedArticle.articleIndex - 1
              });
            } else if (selectedArticle.sourceIndex > 0) {
              const prevSource = news[selectedArticle.sourceIndex - 1];
              if (prevSource.articles && prevSource.articles.length > 0) {
                setDirection(-1);
                setSelectedArticle({
                  ...prevSource.articles[prevSource.articles.length - 1],
                  sourceIndex: selectedArticle.sourceIndex - 1,
                  articleIndex: prevSource.articles.length - 1
                });
              }
            }
          }}
          hasNext={
            selectedArticle.articleIndex < news[selectedArticle.sourceIndex].articles.length - 1 ||
            (selectedArticle.sourceIndex < news.length - 1 && news[selectedArticle.sourceIndex + 1].articles?.length > 0)
          }
          hasPrevious={
            selectedArticle.articleIndex > 0 ||
            (selectedArticle.sourceIndex > 0 && news[selectedArticle.sourceIndex - 1].articles?.length > 0)
          }
          direction={direction}
        />
      )}
    </main>
  );
}
