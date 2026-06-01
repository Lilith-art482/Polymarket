'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, checkIsAdmin } from '@/lib/firebase';
import type { Lang } from '@/lib/i18n';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggle: () => void;
}

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'dark', toggle: () => {} });
const LangContext = createContext<LangContextValue>({ lang: 'RU', setLang: () => {} });
const AuthContext = createContext<AuthContextValue>({ user: null, loading: true, isAdmin: false });

export const useTheme = () => useContext(ThemeContext);
export const useLang = () => useContext(LangContext);
export const useAuth = () => useContext(AuthContext);

export function Providers({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark');
  const [lang, setLang] = useState<Lang>('RU');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) {
      setTheme(stored);
      document.documentElement.classList.toggle('dark', stored === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    const storedLang = localStorage.getItem('lang') as Lang | null;
    if (storedLang && ['EN', 'RU', 'ZH'].includes(storedLang)) {
      setLang(storedLang);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAdmin(checkIsAdmin(u?.email));
      setLoading(false);
    });
    return unsub;
  }, []);

  const toggle = () => {
    setTheme(prev => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  };

  const handleSetLang = (l: Lang) => {
    setLang(l);
    localStorage.setItem('lang', l);
  };

  if (!mounted) return <>{children}</>;

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <LangContext.Provider value={{ lang, setLang: handleSetLang }}>
        <AuthContext.Provider value={{ user, loading, isAdmin }}>
          {children}
        </AuthContext.Provider>
      </LangContext.Provider>
    </ThemeContext.Provider>
  );
}
