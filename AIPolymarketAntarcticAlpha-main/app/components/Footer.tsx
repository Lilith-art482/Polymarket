'use client';

import React from 'react';
import { useT } from '@/lib/useT';

interface FooterProps {
  year?: number;
}

export function Footer({ year = new Date().getFullYear() }: FooterProps) {
  const { t } = useT();

  return (
    <footer id="footer" className="border-t border-gray-200 dark:border-gray-800 pt-16 pb-8 bg-gray-50/50 dark:bg-[#121212]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 mb-12">
          {/* Бренд и описание */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-lg overflow-hidden ring-2 ring-[#4C7F6E]/20">
                <img src="/icon.png" alt="Polymarket AI" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="text-base font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
                  Polymarket <span className="text-[#4C7F6E]">AI</span>
                </div>
                <div className="text-[8px] text-gray-400 dark:text-gray-500 leading-tight tracking-widest uppercase font-medium">
                  Antarctic Alpha
                </div>
              </div>
            </div>
            <p className="text-sm leading-relaxed max-w-sm mb-6 text-gray-600 dark:text-gray-400">
              AI-аналитика, алерты и инструменты для торговли на Polymarket
            </p>

            {/* Контакты */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <svg className="w-4 h-4 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 6l-10 7L2 6" />
                </svg>
                <a href="mailto:support@antarctic-alpha.ru" className="text-gray-600 dark:text-gray-400 hover:text-[#4C7F6E] transition-colors">
                  support@antarctic-alpha.ru
                </a>
              </div>
            </div>
          </div>

          {/* Документы */}
          <div>
            <h4 className="font-semibold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
              </svg>
              Документы
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#4C7F6E] transition-colors flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Политика обработки персональных данных
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-[#4C7F6E] transition-colors flex items-center gap-2">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" />
                    <path d="M7 11V7a5 5 0 0110 0v4" />
                  </svg>
                  Публичная оферта
                </a>
              </li>
            </ul>
          </div>

          {/* Реквизиты и соцсети */}
          <div>
            <h4 className="font-semibold mb-6 text-gray-900 dark:text-white">Реквизиты</h4>
            <div className="text-sm space-y-2 mb-6 text-gray-600 dark:text-gray-400">
              <p>ИП Соболева Ксения Витальевна</p>
              <p>ИНН: 644110963363</p>
              <p>ОГРН: 322645700054948</p>
            </div>

            <h4 className="font-semibold mb-4 text-gray-900 dark:text-white">Социальные сети</h4>
            <div className="flex gap-4">
              <a
                href="https://t.me/antarctic_alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center transition-all hover:text-[#4C7F6E] hover:border-[#4C7F6E] bg-white dark:bg-[#1C1C1E]"
                title="Telegram"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              <a
                href="https://youtube.com/@antarctic_alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center transition-all hover:text-[#4C7F6E] hover:border-[#4C7F6E] bg-white dark:bg-[#1C1C1E]"
                title="YouTube"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              <a
                href="https://x.com/antarctic_alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-800 flex items-center justify-center transition-all hover:text-[#4C7F6E] hover:border-[#4C7F6E] bg-white dark:bg-[#1C1C1E]"
                title="X / Twitter"
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
          <p>© {year} Antarctic Alpha. Все права защищены.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-[#4C7F6E] transition-colors">Политика конфиденциальности</a>
            <a href="#" className="hover:text-[#4C7F6E] transition-colors">Условия использования</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
