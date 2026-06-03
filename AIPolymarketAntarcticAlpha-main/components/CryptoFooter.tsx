'use client';

import { useState } from 'react';

type PanelType = 'alerts' | 'news' | 'tracker' | null;
type PanelPosition = 'left' | 'right';

export function CryptoFooter() {
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const panels: { type: PanelType; label: string }[] = [
    { type: 'alerts', label: 'Alerts' },
    { type: 'news', label: 'News' },
    { type: 'tracker', label: 'Tracker' },
  ];

  const togglePanel = (type: PanelType) => {
    if (activePanel === type) {
      setActivePanel(null);
    } else {
      setActivePanel(type);
      const index = panels.findIndex(p => p.type === type);
      setCurrentIndex(index);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    
    if (isLeftSwipe && currentIndex < panels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isRightSwipe && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
    
    setTouchStart(0);
    setTouchEnd(0);
  };

  const switchPanel = (direction: 'next' | 'prev') => {
    if (direction === 'next' && currentIndex < panels.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (direction === 'prev' && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <>
      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 h-16">
            <button
              onClick={() => togglePanel('alerts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activePanel === 'alerts'
                  ? 'bg-[#4C7F6E] text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Alerts
            </button>
            <button
              onClick={() => togglePanel('news')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activePanel === 'news'
                  ? 'bg-[#4C7F6E] text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              News
            </button>
            <button
              onClick={() => togglePanel('tracker')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                activePanel === 'tracker'
                  ? 'bg-[#4C7F6E] text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2C2C2E]'
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Tracker
            </button>
          </div>
        </div>
      </footer>

      {/* Panel Overlay */}
      {activePanel && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-50"
          onClick={() => setActivePanel(null)}
        />
      )}

      {/* Panel */}
      {activePanel && (
        <div
          className="fixed top-0 bottom-16 z-50 w-full max-w-md bg-white dark:bg-[#1C1C1E] border-r border-gray-200 dark:border-gray-800 shadow-2xl left-0"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {panels[currentIndex].label}
              </h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => switchPanel('prev')}
                  disabled={currentIndex === 0}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Назад"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
                <button
                  onClick={() => switchPanel('next')}
                  disabled={currentIndex === panels.length - 1}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Вперёд"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
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
          <div className="p-4 overflow-y-auto h-[calc(100vh-140px)]">
            {/* Заглушка о разработке */}
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-[#4C7F6E]/20 to-[#4C7F6E]/10 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-10 h-10 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                В разработке
              </h4>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-xs mb-6">
                Функционал "{panels[currentIndex].label}" находится в активной разработке. Скоро здесь появится полезный контент.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>Следите за обновлениями!</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
