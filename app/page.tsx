'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
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
      {theme === 'dark' ? '🌞' : '🌙'}
    </button>
  );
}

export default function Home() {
  const [news, setNews] = useState<NewsSourceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/news');
        if (!response.ok) {
          throw new Error('Failed to fetch news');
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
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <ThemeToggle />
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4">daily tech news</h1>
        <p className="text-gray-600 dark:text-gray-400">
          daily tech news, built by{' '}
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
                <div 
                  key={`${source.source}-${article.url}`}
                  className="border dark:border-gray-700 rounded-lg p-4 shadow hover:shadow-lg transition-shadow bg-white dark:bg-gray-800"
                >
                  <h3 className="font-semibold mb-2">
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {article.title}
                    </a>
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {new Date(article.publishedDate).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 dark:text-gray-300 line-clamp-3">{article.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
