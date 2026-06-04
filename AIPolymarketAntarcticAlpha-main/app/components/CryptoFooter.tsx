'use client';

import { useState } from 'react';
import useSWR from 'swr';

type PanelType = 'alerts' | 'news' | 'tracker' | null;

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

  if (diffMins < 1) return 'Только что';
  if (diffMins < 60) return `${diffMins} мин. назад`;
  if (diffHours < 24) return `${diffHours} ч. назад`;
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

export function CryptoFooter() {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const { data: newsData, error, isLoading, mutate } = useSWR<NewsResponse>(
    activePanel === 'news' ? '/api/news' : null,
    fetcher,
    { refreshInterval: 60000 } // Обновлять каждую минуту
  );

  // Устанавливаем CSS переменную для ширины сайдбара
  if (typeof document !== 'undefined') {
    document.documentElement.style.setProperty('--sidebar-width', activePanel ? '320px' : '0px');
  }

  const panels: { type: PanelType; label: string; icon: React.ReactNode }[] = [
    { 
      type: 'alerts', 
      label: 'Alerts', 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      type: 'news', 
      label: 'News', 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    { 
      type: 'tracker', 
      label: 'Tracker', 
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
  ];

  const togglePanel = (type: PanelType) => {
    if (activePanel === type) {
      setActivePanel(null);
    } else {
      setActivePanel(type);
    }
  };

  return (
    <>
      <style jsx global>{`
        :root {
          --sidebar-width: 0px;
        }
      `}</style>
      {/* Sidebar Panel */}
      <div
        className={`fixed top-0 left-0 bottom-16 z-40 w-80 bg-white dark:bg-[#1C1C1E] border-r border-gray-200 dark:border-gray-800 shadow-xl transition-all duration-300 ${
          activePanel ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Panel Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#4C7F6E] to-[#3D6658] flex items-center justify-center text-white">
              {panels.find(p => p.type === activePanel)?.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 dark:text-white">
                {panels.find(p => p.type === activePanel)?.label}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                В разработке
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePanel(null)}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-all"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Panel Content */}
        <div className="p-4 h-[calc(100vh-140px)] overflow-y-auto">
          {activePanel === 'news' ? (
            <div className="space-y-3">
              {/* Header с кнопкой обновления */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {newsData?.fetchedAt 
                    ? `Обновлено: ${new Date(newsData.fetchedAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                    : 'Загрузка...'}
                </span>
                <button
                  onClick={() => mutate()}
                  disabled={isLoading}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-all disabled:opacity-50"
                >
                  <svg className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${isLoading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>

              {/* Список новостей */}
              {isLoading && !newsData ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="p-3 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-red-500 mb-2">Ошибка загрузки новостей</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{error.message}</p>
                </div>
              ) : newsData?.articles && newsData.articles.length > 0 ? (
                <div className="space-y-3">
                  {newsData.articles.map((article, index) => (
                    <a
                      key={index}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl hover:bg-gray-100 dark:hover:bg-[#3C3C3E] transition-all group"
                    >
                      <div className="flex gap-3">
                        {article.image && (
                          <img
                            src={article.image}
                            alt={article.title}
                            className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-2 mb-1 group-hover:text-[#4C7F6E] transition-colors">
                            {article.title}
                          </h4>
                          {article.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                              {article.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                            <span className="font-medium text-[#4C7F6E]">{article.source.name}</span>
                            <span>•</span>
                            <span>{formatDate(article.publishedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-[#2C2C2E] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Нет новостей за последние 2 часа</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-[#4C7F6E]/20 to-[#4C7F6E]/10 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Скоро здесь будет контент
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs mb-6">
                Функционал "{panels.find(p => p.type === activePanel)?.label}" находится в активной разработке.
              </p>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-[#2C2C2E] rounded-xl">
                <svg className="w-4 h-4 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">Следите за обновлениями!</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={`fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl transition-all duration-300 ${
        activePanel ? 'ml-80' : 'ml-0'
      }`}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 h-16">
            {panels.map((panel) => (
              <button
                key={panel.type}
                onClick={() => togglePanel(panel.type)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activePanel === panel.type
                    ? 'bg-[#4C7F6E] text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
                }`}
              >
                {panel.icon}
                {panel.label}
              </button>
            ))}
          </div>
        </div>
      </footer>

      {/* Overlay */}
      {activePanel && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-30"
          onClick={() => setActivePanel(null)}
        />
      )}
    </>
  );
}
