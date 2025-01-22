'use client';

import { useEffect, useState } from 'react';
import type { NewsSourceResult } from './types/news';

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
      {news.map((source) => (
        <div key={source.source} className="mb-8">
          <h2 className="text-2xl font-bold mb-4">{source.source}</h2>
          {source.error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              <p className="font-medium">Unable to load articles</p>
              <p className="text-sm">{source.error}</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {source.articles.map((article) => (
                <div 
                  key={`${source.source}-${article.url}`}
                  className="border rounded-lg p-4 shadow hover:shadow-lg transition-shadow bg-white"
                >
                  <h3 className="font-semibold mb-2">
                    <a 
                      href={article.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline"
                    >
                      {article.title}
                    </a>
                  </h3>
                  <p className="text-gray-600 text-sm mb-2">
                    {new Date(article.publishedDate).toLocaleDateString()}
                  </p>
                  <p className="text-gray-700 line-clamp-3">{article.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </main>
  );
}
