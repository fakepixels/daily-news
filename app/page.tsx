'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';
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

function ArticleModal({ article, onClose }: { 
  article: { title: string; publishedDate: string; summary: string; url: string; }; 
  onClose: () => void; 
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
  return (
    <dialog 
      open
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 w-full h-full m-0 border-none outline-none"
      onClick={handleOverlayClick}
      onKeyDown={(e: React.KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
        handleOverlayClick(e);
      }}
      aria-modal="true"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="float-right text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          ✕
        </button>
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
    </dialog>
  );
}

export default function Home() {
  const [news, setNews] = useState<NewsSourceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedArticle, setSelectedArticle] = useState<null | {
    title: string;
    publishedDate: string;
    summary: string;
    url: string;
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
      <div className="text-center mb-12">
        <h1 className="text-8xl font-bold mb-4">DAILY TECH NEWS</h1>
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
      </div>
      {news.map((source) => (
        <div key={source.source} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{source.source}</h2>
          {source.error ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
              <p className="font-medium">Unable to load articles</p>
              <p className="text-sm">{source.error}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {source.articles.map((article) => (
                <div key={article.id}>
                  <button 
                    type="button"
                    onClick={() => setSelectedArticle(article)}
                    className="w-full text-left border dark:border-gray-700 rounded-lg p-4 shadow hover:shadow-lg transition-shadow bg-white dark:bg-gray-800 cursor-pointer h-full flex flex-col"
                  >
                    <h3 className="font-semibold mb-2">
                      <span className="text-blue-600 dark:text-blue-400 hover:underline">
                        {article.title}
                      </span>
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
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
        />
      )}
    </main>
  );
}
