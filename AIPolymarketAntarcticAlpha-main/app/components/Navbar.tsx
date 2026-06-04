'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { useT } from '@/lib/useT';
import { useLang } from '@/app/providers';
import { useAuth } from '@/app/providers';
import type { Lang } from '@/lib/i18n';

const langs: Lang[] = ['EN', 'RU', 'ZH'];

type MenuChild = { key: string; href: string; icon: string };
type MenuItem =
  | { type: 'link'; key: string; href: string; icon: string }
  | { type: 'dropdown'; key: string; icon: string; children: MenuChild[] };

const menuItems: MenuItem[] = [
  {
    type: 'dropdown',
    key: 'nav.markets',
    icon: 'M16 8v8m-4-5v5m-4-2v2M4 20h16M4 4v16',
    children: [
      { key: 'nav.crypto', href: '/', icon: 'M16 8v8m-4-5v5m-4-2v2M4 20h16M4 4v16' },
      { key: 'nav.weather', href: '/pogoda', icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z' },
    ],
  },
  { type: 'link', key: 'nav.aiChat', href: '#', icon: 'M12 2a2 2 0 012 2v2.17A3 3 0 0117 9v6a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3V4a2 2 0 012-2h4zM9 21h6' },
  { type: 'link', key: 'nav.news', href: '#', icon: 'M4 4h16v16H4V4zm4 4h8M4 12h16M4 16h16' },
  { type: 'link', key: 'nav.tracker', href: '/tracker', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' },
  { type: 'link', key: 'nav.toch', href: '/kalkulyator', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
];

const navIcons: Record<string, string> = {
  '/': 'M16 8v8m-4-5v5m-4-2v2M4 20h16M4 4v16',
  '/pogoda': 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
  '/kalkulyator': 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
  '/tracker': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
};

export function Navbar() {
  const pathname = usePathname();
  const { t } = useT();
  const { lang, setLang } = useLang();
  const { user, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  if (pathname === '/auth') return null;

  const cycleLang = () => {
    const idx = langs.indexOf(lang);
    setLang(langs[(idx + 1) % langs.length]);
  };

  const isChildActive = (item: MenuItem) => {
    if (item.type !== 'dropdown') return false;
    return item.children.some(child => pathname === child.href);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/70 dark:border-gray-800/50 bg-white/80 dark:bg-transparent backdrop-blur-xl supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-transparent">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={user ? '/' : '/auth'} className="flex items-center gap-3 shrink-0 group">
          <div className="w-11 h-11 rounded-lg overflow-hidden ring-2 ring-[#4C7F6E]/20 group-hover:ring-[#4C7F6E]/40 transition-all">
            <img src="/icon.png" alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="text-base md:text-lg font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
              Polymarket <span className="text-[#4C7F6E]">AI</span>
            </div>
            <div className="text-[9px] text-gray-400 dark:text-gray-500 leading-tight tracking-widest uppercase font-medium">
              Antarctic Alpha
            </div>
          </div>
        </Link>

        {user && (
          <div className="hidden md:flex items-center bg-gray-100/60 dark:bg-transparent rounded-2xl p-1 border border-[#4C7F6E]/50 dark:border-gray-800/50 backdrop-blur-sm">
            {menuItems.map(item => {
              if (item.type === 'link') {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-[#4C7F6E] text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                    {t(item.key)}
                  </Link>
                );
              }

              const isActive = isChildActive(item);
              return (
                <div
                  key={item.key}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.key)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => setOpenDropdown(openDropdown === item.key ? null : item.key)}
                    className={`flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-[#4C7F6E] text-white shadow-sm'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/30 dark:hover:bg-white/5'
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                    {t(item.key)}
                    <svg className={`w-3 h-3 transition-transform ${openDropdown === item.key ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
                      <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {openDropdown === item.key && (
                    <div className="absolute top-full left-0 w-48 pt-1">
                      <div className="bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#2C2C2E] rounded-xl shadow-xl py-1">
                        {item.children.map(child => {
                          const childActive = pathname === child.href;
                          return (
                            <Link
                              key={child.key}
                              href={child.href}
                              className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                                childActive
                                  ? 'text-[#4C7F6E] bg-[#4C7F6E]/5'
                                  : 'text-gray-600 dark:text-gray-300 hover:text-white hover:bg-[#4C7F6E]'
                              }`}
                            >
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                <path d={child.icon} />
                              </svg>
                              {t(child.key)}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-1.5 md:gap-2">
          {!loading && (
            user ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200 hover:bg-gray-100 dark:hover:bg-[#1C1C1E] group"
              >
                <div className="w-7 h-7 rounded-full overflow-hidden bg-[#4C7F6E]/10 flex items-center justify-center ring-2 ring-[#4C7F6E]/20 group-hover:ring-[#4C7F6E]/40 transition-all">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-4 h-4 text-[#4C7F6E]" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5"/>
                      <path d="M4 18a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                  )}
                </div>
                <span className="hidden md:block text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                  {user.displayName || user.email?.split('@')[0]}
                </span>
              </Link>
            ) : (
              <Link
                href="/auth"
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#4C7F6E] hover:bg-[#3D6658] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="6.5" r="2.5" fill="currentColor"/>
                  <path d="M3 17c0-2.5 3-4 7-4s7 1.5 7 4" fill="currentColor"/>
                </svg>
                Войти
              </Link>
            )
          )}
          <div className="flex items-center gap-1 pl-1.5 md:pl-2 border-l border-gray-200 dark:border-gray-800">
            <button
              onClick={cycleLang}
              className="w-8 h-8 flex items-center justify-center text-[11px] font-bold rounded-lg bg-white/60 dark:bg-transparent backdrop-blur-sm text-gray-600 dark:text-gray-400 hover:bg-white/80 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-white transition-all duration-200 tracking-wider"
            >
              {lang}
            </button>
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-white/60 dark:bg-transparent backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/5 transition-colors"
              aria-label="Меню"
            >
              <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200/70 dark:border-gray-800/50 bg-white dark:bg-[#121212]">
          <div className="px-4 py-3 space-y-1">
            {user && menuItems.map(item => {
              if (item.type === 'link') {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-[#4C7F6E] text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1C1C1E]'
                    }`}
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.icon} />
                    </svg>
                    {t(item.key)}
                  </Link>
                );
              }

              const isActive = isChildActive(item);
              return (
                <div key={item.key}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === item.key ? null : item.key)}
                    className={`flex items-center justify-between w-full px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-[#4C7F6E] text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1C1C1E]'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d={item.icon} />
                      </svg>
                      {t(item.key)}
                    </span>
                    <svg className={`w-3 h-3 transition-transform ${openDropdown === item.key ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
                      <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {openDropdown === item.key && (
                    <div className="ml-4 mt-1 space-y-0.5 bg-gray-50 dark:bg-[#1C1C1E] rounded-xl p-2 border border-gray-100 dark:border-gray-800">
                      {item.children.map(child => {
                        const childActive = pathname === child.href;
                        return (
                          <Link
                            key={child.key}
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                              childActive
                                ? 'text-[#4C7F6E] bg-[#4C7F6E]/5'
                                : 'text-gray-500 dark:text-gray-400 hover:text-white hover:bg-[#4C7F6E]'
                            }`}
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                              <path d={child.icon} />
                            </svg>
                            {t(child.key)}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
            {user ? (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2 space-y-1">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1C1C1E] transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M4 18a6 6 0 0112 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  {user.displayName || user.email?.split('@')[0] || 'Профиль'}
                </Link>
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    // logout logic here
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-red-500 dark:text-red-400 hover:text-white hover:bg-red-500 transition-all w-full text-left"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                    <path d="M10 3a1.5 1.5 0 011.5 1.5v5m0 5a1.5 1.5 0 01-1.5 1.5H3.5a1.5 1.5 0 01-1.5-1.5v-9a1.5 1.5 0 011.5-1.5H10z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Выйти
                </button>
              </div>
            ) : (
              <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
                <Link
                  href="/auth"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl text-[#4C7F6E] hover:text-white hover:bg-[#4C7F6E] transition-all"
                >
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="6.5" r="2.5" fill="currentColor"/>
                    <path d="M3 17c0-2.5 3-4 7-4s7 1.5 7 4" fill="currentColor"/>
                  </svg>
                  Войти
                </Link>
              </div>
            )}
            <div className="border-t border-gray-200 dark:border-gray-800 pt-2 mt-2">
              <div className="flex items-center gap-2 px-4 py-2">
                <button
                  onClick={cycleLang}
                  className="w-8 h-8 flex items-center justify-center text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2C2C2E] hover:text-gray-900 dark:hover:text-white transition-all duration-200 tracking-wider"
                >
                  {lang}
                </button>
                <ThemeToggle />
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
