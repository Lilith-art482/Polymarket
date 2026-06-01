'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp, query, where, getDocs, collection } from 'firebase/firestore';
import { auth, db, checkIsAdmin } from '@/lib/firebase';
import { useT } from '@/lib/useT';
import { useLang } from '@/app/providers';
import { ThemeToggle } from '@/components/ThemeToggle';
import type { Lang } from '@/lib/i18n';

const langs: Lang[] = ['EN', 'RU', 'ZH'];

export default function AuthPage() {
  const { t } = useT();
  const { lang, setLang } = useLang();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderEmail, setReminderEmail] = useState('');
  const [reminderSuccess, setReminderSuccess] = useState(false);

  const cycleLang = () => {
    const idx = langs.indexOf(lang);
    setLang(langs[(idx + 1) % langs.length]);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        const role = checkIsAdmin(email) ? 'admin' : 'user';
        await setDoc(doc(db, 'users', cred.user.uid), {
          email,
          role,
          plan: 'free',
          createdAt: Timestamp.now(),
        });
        setMode('login');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/email-already-in-use') setError('Этот email уже зарегистрирован');
      else if (code === 'auth/invalid-credential' || code === 'auth/user-not-found' || code === 'auth/wrong-password')
        setError('Неверный email или пароль');
      else if (code === 'auth/weak-password') setError('Пароль должен быть минимум 6 символов');
      else if (code === 'auth/invalid-email') setError('Некорректный email');
      else setError(err.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const handleReminder = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const q = query(collection(db, 'users'), where('email', '==', reminderEmail.toLowerCase()));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await sendPasswordResetEmail(auth, reminderEmail.toLowerCase());
        setReminderSuccess(true);
      } else {
        setError(t('auth.emailNotFound'));
      }
    } catch (err: any) {
      setError(t('auth.restoreError'));
    }
  };

  const handleReminderSubmit = () => {
    setShowReminderModal(true);
    setError('');
  };

  const closeReminderModal = () => {
    setShowReminderModal(false);
    setReminderEmail('');
    setReminderSuccess(false);
    setError('');
  };

  return (
    <main className="min-h-screen flex flex-col md:flex-row relative bg-white dark:bg-[#121212]">
      {/* Floating lang/theme toggles */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <button
          onClick={cycleLang}
          className="p-2.5 text-sm font-semibold rounded-xl bg-white dark:bg-[#1a1d29] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#252938] transition-all duration-200 border border-gray-200 dark:border-[#2a2f42] leading-none"
        >
          {lang}
        </button>
        <ThemeToggle />
      </div>

      {/* Left — brand */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-12 min-h-[40vh] md:min-h-screen relative overflow-hidden bg-[#121212]">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#4C7F6E]/60 via-transparent to-transparent pointer-events-none" />
        <div className="flex flex-col items-center justify-center">
          <img src="/icon.png" alt="" className="w-48 h-48 md:w-56 md:h-56 rounded-3xl mb-1" />
          <h1 className="text-4xl md:text-5xl font-bold text-center text-white">
            Polymarket <span className="text-[#4C7F6E]">AI</span>
          </h1>
          <p className="text-sm md:text-base text-white/50 mt-2 tracking-widest uppercase">
            Antarctic Alpha
          </p>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              {mode === 'login' ? t('auth.login') : t('auth.register')}
            </h1>
          </div>

          {/* Mode toggle - centered */}
          <div className="flex bg-gray-100 dark:bg-[#1C1C1E] rounded-xl p-1.5">
            <button
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 py-3 text-base font-semibold rounded-lg transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white shadow-lg'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              {t('auth.login')}
            </button>
            <button
              onClick={() => { setMode('register'); setError(''); }}
              className={`flex-1 py-3 text-base font-semibold rounded-lg transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white dark:bg-[#2C2C2E] text-gray-900 dark:text-white shadow-lg'
                  : 'text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white'
              }`}
            >
              {t('auth.register')}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoComplete="email"
                className="block w-full px-4 py-3.5 rounded-xl text-base border border-gray-300 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#4C7F6E] focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  className="block w-full px-4 py-3.5 pr-12 rounded-xl text-base border border-gray-300 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#4C7F6E] focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-[#4C7F6E] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Reminder */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#4C7F6E] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#4C7F6E]" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{t('auth.rememberMe')}</span>
              </label>
              <button
                type="button"
                onClick={handleReminderSubmit}
                className="text-sm font-semibold text-[#4C7F6E] hover:text-[#3D6658] transition-colors"
              >
                Восстановить пароль
              </button>
            </div>

            {error && (
              <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={busy || !email || !password}
              className="w-full py-4 bg-[#4C7F6E] hover:bg-[#3D6658] active:bg-[#2E5247] text-white text-base font-semibold rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:shadow-md"
            >
              {busy ? t('auth.wait') : mode === 'login' ? t('auth.loginBtn') : t('auth.registerBtn')}
            </button>
          </form>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-800" />

          {/* Bottom buttons with icons */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href="mailto:antarctic.alpha@yandex.ru"
              className="flex flex-col items-center justify-center gap-2 py-3.5 rounded-xl border border-[#4C7F6E] text-gray-600 dark:text-gray-300 hover:text-[#4C7F6E] bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all duration-200"
            >
              <svg className="w-5 h-5 text-[#4C7F6E]" viewBox="0 0 20 20" fill="currentColor">
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <path d="M8 8a2 2 0 013.5-1.3c.5.5.6 1.3.2 1.9L10 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                <circle cx="10" cy="14" r="1" fill="currentColor"/>
              </svg>
              <span className="text-sm font-medium">{t('auth.help')}</span>
            </a>
            <Link
              href="/"
              className="flex flex-col items-center justify-center gap-2 py-3.5 rounded-xl border border-[#4C7F6E] text-gray-600 dark:text-gray-300 hover:text-[#4C7F6E] bg-gray-50 dark:bg-white/[0.04] hover:bg-gray-100 dark:hover:bg-white/[0.07] transition-all duration-200"
            >
              <svg className="w-5 h-5 text-[#4C7F6E]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                <path d="M18 10H3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <span className="text-sm font-medium">{t('auth.back')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Reminder Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-2xl w-full max-w-md p-6 border border-gray-200 dark:border-[#2C2C2E]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('auth.reminder')}
              </h3>
              <button
                onClick={closeReminderModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {!reminderSuccess ? (
              <form onSubmit={handleReminder} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    value={reminderEmail}
                    onChange={e => setReminderEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="block w-full px-4 py-3 rounded-xl text-base border border-gray-300 dark:border-[#2C2C2E] bg-white dark:bg-[#1C1C1E] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#4C7F6E] focus:border-transparent transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>

                {error && (
                  <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 px-4 py-3 rounded-xl border border-red-200 dark:border-red-800/20">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#4C7F6E] hover:bg-[#3D6658] text-white text-base font-semibold rounded-xl transition-all duration-200"
                >
                  {t('auth.restoreBtn')}
                </button>
              </form>
            ) : (
              <div className="space-y-5 text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-[#4C7F6E]/10 flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#4C7F6E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {t('auth.resetSentTitle')}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  {t('auth.resetSentDesc')}
                </p>
                <button
                  onClick={closeReminderModal}
                  className="w-full py-3.5 bg-[#4C7F6E] hover:bg-[#3D6658] text-white text-base font-semibold rounded-xl transition-all duration-200"
                >
                  {t('auth.close')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
