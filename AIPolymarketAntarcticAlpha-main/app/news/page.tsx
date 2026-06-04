'use client';

import useSWR from 'swr';
import { useState } from 'react';

interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

interface NewsResponse {
  articles: NewsArticle[];
  count: number;
  fetchedAt: string;
  error?: string;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function NewsPage() {
  const { data: newsData, error, isLoading, mutate } = useSWR<NewsResponse>('/api/news', fetcher, {
    refreshInterval: 60000, // Обновлять каждую минуту
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Header */}
      <div className="bg-white dark:bg-[#1C1C1E] border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4C7F6E] to-[#3D6658] flex items-center justify-center text-white">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Новости</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Криптовалюты и финансовые рынки
                </p>
              </div>
            </div>
            <button
              onClick={() => mutate()}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-[#2C2C2E] hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-all disabled:opacity-50"
            >
              <svg className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Обновить</span>
            </button>
          </div>

          {/* Инфо-панель */}
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Новости EN + RU за 24 часа</span>
            </div>
            {newsData?.fetchedAt && (
              <span>
                Обновлено: {new Date(newsData.fetchedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            {newsData && (
              <span className="px-2 py-0.5 rounded-full bg-[#4C7F6E]/10 text-[#4C7F6E] font-medium">
                {newsData.count} новостей
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Список новостей */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {isLoading && !newsData ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-xl flex-shrink-0"></div>
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Ошибка загрузки</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">{error.message}</p>
            <button
              onClick={() => mutate()}
              className="px-6 py-3 bg-[#4C7F6E] hover:bg-[#3D6658] text-white font-medium rounded-xl transition-all"
            >
              Попробовать снова
            </button>
          </div>
        ) : newsData?.articles && newsData.articles.length > 0 ? (
          <div className="space-y-4">
            {newsData.articles.map((article, index) => (
              <a
                key={index}
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white dark:bg-[#1C1C1E] rounded-2xl p-5 border border-gray-200 dark:border-gray-800 hover:border-[#4C7F6E] dark:hover:border-[#4C7F6E] hover:shadow-lg transition-all group"
              >
                <div className="flex gap-4">
                  {article.image ? (
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-br from-[#4C7F6E]/20 to-[#4C7F6E]/10 rounded-xl flex items-center justify-center flex-shrink-0">
                      <svg className="w-8 h-8 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-[#4C7F6E] transition-colors">
                      {article.title}
                    </h2>
                    {article.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
                        {article.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-medium text-[#4C7F6E]">{article.source.name}</span>
                      <span>•</span>
                      <span>{formatDate(article.publishedAt)}</span>
                      <span className="flex items-center gap-1 ml-auto text-gray-400 group-hover:text-[#4C7F6E] transition-colors">
                        <span>Открыть</span>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Нет новостей</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              За последние 24 часа не найдено новостей на английском и русском языках
            </p>
            <button
              onClick={() => mutate()}
              className="px-6 py-3 bg-[#4C7F6E] hover:bg-[#3D6658] text-white font-medium rounded-xl transition-all"
            >
              Обновить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
