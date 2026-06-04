'use client';

import { useState, useEffect } from 'react';
import { signOut, updateProfile, sendPasswordResetEmail, verifyBeforeUpdateEmail } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useAuth } from '@/app/providers';
import { useRouter } from 'next/navigation';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PLANS: Record<string, { label: string; badge: string; features: string[]; price: string }> = {
  free: {
    label: 'Бесплатный',
    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    features: ['Сигналы 5 раз/день', 'История до 10 записей', 'Базовые индикаторы'],
    price: '0 ₽',
  },
  scout: {
    label: 'Scout',
    badge: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400',
    features: ['15 сигналов/день (будни)', 'История до 30 записей', 'AI анализ до 20 событий'],
    price: '150 ₽/мес',
  },
  alpha: {
    label: 'Alpha',
    badge: 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400',
    features: ['Авто-алерты на 3 рынка', 'История до 100 записей', 'AI анализ до 100 событий', 'Сентимент толпы'],
    price: '330 ₽/мес',
  },
  apex: {
    label: 'Apex PRO',
    badge: 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400',
    features: ['Безлимитный AI анализ', 'История до 500 записей', 'Cross-Market Arbitrage Scanner', 'Black Swan алерты'],
    price: '750 ₽/мес',
  },
};

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [pwSent, setPwSent] = useState(false);
  const [plan, setPlan] = useState('free');
  const [newEmail, setNewEmail] = useState('');
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid)).then(snap => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.plan) setPlan(data.plan);
        setDisplayName(prev => prev || data.displayName || '');
      }
    });
  }, [user]);

  if (loading) return null;
  if (!user) { router.replace('/auth'); return null; }

  const handleSaveName = async () => {
    if (!displayName.trim()) { setErr('Введите имя'); return; }
    setBusy(true);
    setMsg('');
    setErr('');
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      await setDoc(doc(db, 'users', user.uid), { displayName: displayName.trim() }, { merge: true });
      setMsg('Имя сохранено');
    } catch (e: any) {
      setErr(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    setBusy(true);
    setMsg('');
    setErr('');
    setPwSent(false);
    try {
      await sendPasswordResetEmail(auth, user.email!);
      setPwSent(true);
      setMsg('Ссылка для сброса пароля отправлена на ваш email');
    } catch (e: any) {
      setErr(e.message || 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim() || !EMAIL_RE.test(newEmail.trim())) {
      setErr('Введите корректный email');
      return;
    }
    setEmailBusy(true);
    setErr('');
    setMsg('');
    setEmailSent(false);
    try {
      await verifyBeforeUpdateEmail(user, newEmail.trim());
      setEmailSent(true);
      setMsg(`Письмо для подтверждения отправлено на ${newEmail.trim()}`);
      setNewEmail('');
    } catch (e: any) {
      const code = e.code || '';
      if (code === 'auth/requires-recent-login') setErr('Пожалуйста, выйдите и войдите снова, затем повторите попытку');
      else if (code === 'auth/email-already-in-use') setErr('Этот email уже используется');
      else setErr(e.message || 'Ошибка');
    } finally {
      setEmailBusy(false);
    }
  };

  const currentPlan = PLANS[plan] || null;

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-[#121212]">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Личный кабинет</h1>

        {/* Profile Header */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-[#4C7F6E]/10 to-transparent px-6 py-6">
            <div className="flex items-center gap-5">
              <div>
                <div className="text-lg font-bold text-gray-900 dark:text-white">{displayName || user.email?.split('@')[0]}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</div>
                <a
                  href="#"
                  className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[#4C7F6E] hover:bg-[#3D6658] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 19.5A2.5 2.5 0 016.5 17H20M4 4v16M20 4v16M6.5 2H20v15H6.5A2.5 2.5 0 014 14.5V2z"/>
                  </svg>
                  Обучение
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2C2C2E]">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Настройки аккаунта</h2>
          </div>
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Логин</label>
              <div className="flex gap-2 mt-1.5">
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Ваше имя"
                  className="flex-1 px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-[#2C2C2E] bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#4C7F6E] transition-colors placeholder-gray-400 dark:placeholder-gray-600"
                />
                <button
                  onClick={handleSaveName}
                  disabled={busy || !displayName.trim()}
                  className="px-4 py-2 bg-[#4C7F6E] hover:bg-[#3D6658] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 shrink-0"
                >
                  {busy ? '...' : 'Сохранить'}
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</label>
              <div className="space-y-2 mt-1.5">
                <div className="px-3 py-2 rounded-lg text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2C2C2E]">
                  {user.email}
                </div>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="Новый email"
                    className="flex-1 px-3 py-2 rounded-lg text-sm border border-gray-300 dark:border-[#2C2C2E] bg-gray-50 dark:bg-[#121212] text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#4C7F6E] transition-colors placeholder-gray-400 dark:placeholder-gray-600"
                  />
                  <button
                    onClick={handleEmailChange}
                    disabled={emailBusy || !newEmail.trim()}
                    className="px-4 py-2 bg-[#4C7F6E] hover:bg-[#3D6658] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40 shrink-0"
                  >
                    {emailBusy ? '...' : 'Сменить'}
                  </button>
                </div>
                {emailSent && (
                  <p className="text-xs text-gray-400">Письмо для подтверждения отправлено на новый адрес.</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Пароль</label>
              <div className="mt-1.5">
                <button
                  onClick={handleResetPassword}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#4C7F6E] hover:bg-[#3D6658] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-40"
                >
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1a4 4 0 00-4 4v2H3a1 1 0 00-1 1v6a1 1 0 001 1h10a1 1 0 001-1V8a1 1 0 00-1-1h-1V5a4 4 0 00-4-4zm-2 4a2 2 0 114 0v2H6V5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Отправить ссылку для смены пароля
                </button>
                {pwSent && (
                  <p className="mt-1.5 text-xs text-gray-400">Письмо отправлено. Проверьте почтовый ящик.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* My Subscriptions */}
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2C2C2E]">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Мои подписки</h2>
          </div>
          <div className="px-6 py-5">
            {currentPlan ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold ${currentPlan.badge}`}>
                      {currentPlan.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{currentPlan.price}</span>
                  </div>
                  {plan !== 'free' && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Активна
                    </span>
                  )}
                </div>
                <ul className="space-y-1.5">
                  {currentPlan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <svg className="w-3.5 h-3.5 text-[#4C7F6E] shrink-0" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[#4C7F6E] hover:text-[#3D6658] transition-colors"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                    <path d="M7 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {plan === 'free' ? 'Выбрать тариф' : 'Изменить тариф'}
                </a>
              </div>
            ) : (
              <div className="text-center py-4">
                <svg className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <p className="text-sm text-gray-500 dark:text-gray-400">Нет активной подписки</p>
                <a
                  href="/"
                  className="inline-flex items-center gap-1 mt-3 px-4 py-2 bg-[#4C7F6E] hover:bg-[#3D6658] text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Выбрать тариф
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        {msg && (
          <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/20 px-4 py-2.5 rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            {msg}
          </div>
        )}
        {err && (
          <div className="text-sm text-red-500 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 px-4 py-2.5 rounded-lg flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 5v4M8 11v0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {err}
          </div>
        )}

        {/* Sign Out */}
        <button
          onClick={() => signOut(auth)}
          className="w-full py-3 bg-white dark:bg-[#1C1C1E] hover:bg-red-50 dark:hover:bg-red-900/10 text-red-500 hover:text-red-600 text-sm font-medium rounded-xl border border-gray-200 dark:border-[#2C2C2E] transition-colors"
        >
          Выйти из аккаунта
        </button>
      </div>
    </main>
  );
}
