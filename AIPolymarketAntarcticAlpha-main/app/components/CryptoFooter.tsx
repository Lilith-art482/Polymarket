'use client';

import { useState } from 'react';

type PanelType = 'alerts' | 'news' | 'tracker' | null;

export function CryptoFooter() {
  const [activePanel, setActivePanel] = useState<PanelType>(null);

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
        <div className="p-6">
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
