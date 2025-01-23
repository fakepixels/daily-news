'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { NewsSourceResult } from './types/news';

function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="fixed top-4 right-4 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
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
  direction,
  isRead
}: { 
  article: { title: string; publishedDate: string; summary: string; url: string; sourceIndex?: number; }; 
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  direction: number;
  isRead: boolean;
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
          <h3 className="font-semibold text-blue-600 dark:text-blue-400">What?</h3>
          <p className="text-gray-700 dark:text-gray-300">{article.summary}</p>
        </div>
        
        <div>
          <h3 className="font-semibold text-blue-600 dark:text-blue-400">When?</h3>
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
          <h3 className="font-semibold text-blue-600 dark:text-blue-400">Why?</h3>
          {!showExplanation ? (
            <button
              type="button"
              onClick={getExplanation}
              disabled={loadingExplanation}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loadingExplanation ? 'Generating explanation...' : 'Explain news'}
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
          className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
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
  const [news, setNews] = useState<NewsSourceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [readArticles, setReadArticles] = useState<Set<string>>(new Set());
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

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch news');
        }
        const data = await response.json();
        setNews(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
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
      <ThemeToggle />
      <header className="text-center mb-16">
        <h1 className="text-9xl font-bold mb-4">DAILY TECH NEWS</h1>
        <p className="text-gray-600 dark:text-gray-400">
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
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            @fkpxls
          </a>
        </p>
      </header>
      <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mb-16" />
      {news.map((source) => (
        <div key={source.source} className="mb-16">
          <h2 className="text-3xl font-bold mb-8 tracking-tight">{source.source}</h2>
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
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                      {new Date(article.publishedDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300 line-clamp-3 flex-grow">
                      {article.summary}
                    </p>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {selectedArticle && (
        <ArticleModal
          key={`${selectedArticle.sourceIndex}-${selectedArticle.articleIndex}`}
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          onNext={() => {
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
