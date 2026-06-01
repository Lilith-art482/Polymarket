'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';
import { useLang } from '@/app/providers';
import { dict, type Lang } from '@/lib/i18n';
import { AnimatedCounter } from './AnimatedCounter';
import { Footer } from './Footer';

const langs: Lang[] = ['EN', 'RU', 'ZH'];

export function LandingPage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [botModalOpen, setBotModalOpen] = useState(false);
  const [selectedBotTier, setSelectedBotTier] = useState<{ duration: string; price: string } | null>(null);
  const [selectedBotType, setSelectedBotType] = useState<string | null>(null);
  const [selectedProductTiers, setSelectedProductTiers] = useState<Record<number, { duration: string; price: string }>>({});
  const { lang, setLang } = useLang();

  const t = (key: string) => dict[lang][key] || key;

  const navItems = [
    {
      label: t('land.nav.about'),
      type: 'dropdown' as const,
      children: [
        { label: t('land.nav.mission'), id: 'mission' },
        { label: t('land.nav.numbers'), id: 'numbers' },
        { label: t('land.nav.faq'), id: 'faq' },
      ],
    },
    {
      label: t('land.nav.community'),
      type: 'dropdown' as const,
      children: [
        { label: t('land.nav.inside'), id: 'community' },
        { label: t('land.nav.features'), id: 'features' },
      ],
    },
    { label: t('land.nav.pricing'), type: 'link' as const, id: 'pricing' },
    { label: t('land.nav.products'), type: 'link' as const, id: 'products' },
    { label: t('land.nav.contacts'), type: 'link' as const, id: 'footer' },
  ];

  const faqItems = [
    { q: t('land.faq.q1'), a: t('land.faq.a1') },
    { q: t('land.faq.q2'), a: t('land.faq.a2') },
    { q: t('land.faq.q3'), a: t('land.faq.a3') },
    { q: t('land.faq.q4'), a: t('land.faq.a4') },
    { q: t('land.faq.q5'), a: t('land.faq.a5') },
    { q: t('land.faq.q6'), a: t('land.faq.a6') },
    { q: t('land.faq.q7'), a: t('land.faq.a7') },
    { q: t('land.faq.q8'), a: t('land.faq.a8') },
    { q: t('land.faq.q9'), a: t('land.faq.a9') },
    { q: t('land.faq.q10'), a: t('land.faq.a10') },
  ];

  const numbersData = [
    { icon: 'chart', value: '6+', label: t('land.numbers.assets') },
    { icon: 'uptime', value: '99%', label: t('land.numbers.uptime') },
    { icon: 'speed', value: '< 5с', label: t('land.numbers.speed') },
    { icon: 'clock', value: '24/7', label: t('land.numbers.monitoring') },
  ];

  const featuresData = [
    { svg: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', title: t('land.features.technical.title'), desc: t('land.features.technical.desc') },
    { svg: 'M13 10V3L4 14h7v7l9-11h-7z', title: t('land.features.signals.title'), desc: t('land.features.signals.desc') },
    { svg: 'M8 12l4 4 5-5M3 12h1m4-8v1m8 7v1m-4 7v1', title: t('land.features.integration.title'), desc: t('land.features.integration.desc') },
    { svg: 'M9 12h6m-3-3v6m-7 7h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z', title: t('land.features.history.title'), desc: t('land.features.history.desc') },
    { svg: 'M3 5h12M3 12h18M3 19h6M20.354 15.354A9 9 0 018.646 3.646', title: t('land.features.multilang.title'), desc: t('land.features.multilang.desc') },
    { svg: 'M12 2a8 8 0 00-8 8v4l-2 2h20l-2-2v-4a8 8 0 00-8-8zm0 16a2 2 0 01-2-2h4a2 2 0 01-2 2z', title: t('land.features.ai.title'), desc: t('land.features.ai.desc') },
    { svg: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 14h.01M12 7h.01M15 7h.01M12 21a9 9 0 100-18 9 9 0 000 18z', title: t('land.features.calculator.title'), desc: t('land.features.calculator.desc') },
    { svg: 'M12 10v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', title: t('land.features.export.title'), desc: t('land.features.export.desc') },
    { svg: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253', title: t('land.features.course.title'), desc: t('land.features.course.desc') },
  ];

  const pricingData = [
    {
      name: t('land.pricing.scout.name'),
      desc: t('land.pricing.scout.desc'),
      priceWeek: '30',
      priceMonth: '108',
      popular: false,
      saving: 10,
      decor: 'M2 12a5 5 0 015-5m0 0a5 5 0 015 5m-5-5V2m0 20v-5m0 0a5 5 0 01-5-5m5 5a5 5 0 005-5',
      features: [
        { icon: 'refresh', text: t('land.pricing.scout.f1'), tooltip: t('land.pricing.scout.f1.tooltip') },
        { icon: 'bell', text: t('land.pricing.scout.f2'), tooltip: t('land.pricing.scout.f2.tooltip') },
        { icon: 'calculator', text: t('land.pricing.scout.f3'), tooltip: t('land.pricing.scout.f3.tooltip') },
        { icon: 'chat', text: t('land.pricing.scout.f4'), tooltip: t('land.pricing.scout.f4.tooltip') },
        { icon: 'ai', text: t('land.pricing.scout.f5'), tooltip: t('land.pricing.scout.f5.tooltip') },
        { icon: 'history', text: t('land.pricing.scout.f6'), tooltip: t('land.pricing.scout.f6.tooltip') },
      ],
    },
    {
      name: t('land.pricing.alpha.name'),
      desc: t('land.pricing.alpha.desc'),
      priceWeek: '85',
      priceMonth: '272',
      popular: true,
      saving: 20,
      decor: 'M12 2a10 10 0 0110 10m-10-4a4 4 0 014 4m-4-2a2 2 0 012 2',
      features: [
        { icon: 'refresh', text: t('land.pricing.alpha.f1'), tooltip: t('land.pricing.alpha.f1.tooltip') },
        { icon: 'bell', text: t('land.pricing.alpha.f2'), tooltip: t('land.pricing.alpha.f2.tooltip') },
        { icon: 'calculator', text: t('land.pricing.alpha.f3'), tooltip: t('land.pricing.alpha.f3.tooltip') },
        { icon: 'chat', text: t('land.pricing.alpha.f4'), tooltip: t('land.pricing.alpha.f4.tooltip') },
        { icon: 'ai', text: t('land.pricing.alpha.f5'), tooltip: t('land.pricing.alpha.f5.tooltip') },
        { icon: 'history', text: t('land.pricing.alpha.f6'), tooltip: t('land.pricing.alpha.f6.tooltip') },
        { icon: 'users', text: t('land.pricing.alpha.f7'), tooltip: t('land.pricing.alpha.f7.tooltip') },
        { icon: 'book', text: t('land.pricing.alpha.f8') },
      ],
    },
    {
      name: t('land.pricing.apex.name'),
      desc: t('land.pricing.apex.desc'),
      priceWeek: '150',
      priceMonth: '420',
      popular: false,
      saving: 30,
      decor: 'M4 21h16M12 3v12m0 0l-4-4m4 4l4-4',
      features: [
        { icon: 'refresh', text: t('land.pricing.apex.f1'), tooltip: t('land.pricing.apex.f1.tooltip') },
        { icon: 'bell', text: t('land.pricing.apex.f2'), tooltip: t('land.pricing.apex.f2.tooltip') },
        { icon: 'calculator', text: t('land.pricing.apex.f3'), tooltip: t('land.pricing.apex.f3.tooltip') },
        { icon: 'chat', text: t('land.pricing.apex.f4'), tooltip: t('land.pricing.apex.f4.tooltip') },
        { icon: 'ai', text: t('land.pricing.apex.f5'), tooltip: t('land.pricing.apex.f5.tooltip') },
        { icon: 'history', text: t('land.pricing.apex.f6'), tooltip: t('land.pricing.apex.f6.tooltip') },
        { icon: 'users', text: t('land.pricing.apex.f7'), tooltip: t('land.pricing.apex.f7.tooltip') },
        { icon: 'heart', text: t('land.pricing.apex.f8'), tooltip: t('land.pricing.apex.f8.tooltip') },
        { icon: 'bot', text: t('land.pricing.apex.f9'), tooltip: t('land.pricing.apex.f9.tooltip') },
      ],
    },
  ];

  const scrollTo = (id: string) => {
    setMobileMenu(false);
    setOpenDropdown(null);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const cycleLang = () => {
    const idx = langs.indexOf(lang);
    setLang(langs[(idx + 1) % langs.length]);
  };

  return (
    <div className="bg-[#F9F9FA]/90 dark:bg-[#121212] text-gray-900 dark:text-white">
      <nav className="border-b border-gray-200/70 dark:border-gray-800/50 bg-white dark:bg-[#121212]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-11 h-11 rounded-lg overflow-hidden ring-2 ring-[#4C7F6E]/20">
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
          </div>

          <div className="hidden md:flex items-center bg-gray-100 dark:bg-[#1C1C1E] rounded-2xl p-1 border border-[#4C7F6E]/50 dark:border-gray-700/50 gap-0.5">
            {navItems.map(item => {
              if (item.type === 'link') {
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollTo(item.id)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-white hover:bg-[#4C7F6E] hover:shadow-md"
                  >
                    {item.label}
                  </button>
                );
              }
              return (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setOpenDropdown(item.label)}
                  onMouseLeave={() => setOpenDropdown(null)}
                >
                  <button
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-white hover:bg-[#4C7F6E] hover:shadow-md"
                  >
                    {item.label}
                    <svg className={`w-3 h-3 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
                      <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {openDropdown === item.label && (
                    <div className="absolute top-full left-0 w-56 pt-2">
                      <div className="bg-white dark:bg-[#1C1C1E] border border-[#4C7F6E]/70 dark:border-gray-700/50 rounded-xl shadow-xl py-2">
                        {item.children.map(child => (
                          <button
                            key={child.id}
                            onClick={() => scrollTo(child.id)}
                            className="block w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:text-white hover:bg-[#4C7F6E] transition-colors"
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            <Link
              href="/auth"
              className="hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-[#4C7F6E] hover:bg-[#3D6658] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              {t('land.nav.login')}
            </Link>
            <div className="flex items-center gap-1 pl-1.5 md:pl-2 border-l border-gray-200 dark:border-gray-800">
              <button
                onClick={cycleLang}
                className="w-8 h-8 flex items-center justify-center text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2C2C2E] hover:text-gray-900 dark:hover:text-white transition-all duration-200 tracking-wider"
              >
                {lang}
              </button>
              <ThemeToggle />
              <button
                onClick={() => setMobileMenu(!mobileMenu)}
                className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-[#1C1C1E] hover:bg-gray-200 dark:hover:bg-[#2C2C2E] transition-colors"
                aria-label={t('land.nav.menu')}
              >
                <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  {mobileMenu ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
        {mobileMenu && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-[#121212] shadow-lg">
            <div className="px-4 py-4 space-y-1">
              {navItems.map(item => {
                if (item.type === 'link') {
                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollTo(item.id)}
                      className="flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-white hover:bg-[#4C7F6E] w-full text-left"
                    >
                      {item.label}
                    </button>
                  );
                }
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                      className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 text-gray-600 dark:text-gray-300 hover:text-white hover:bg-[#4C7F6E]"
                    >
                      {item.label}
                      <svg className={`w-3 h-3 transition-transform ${openDropdown === item.label ? 'rotate-180' : ''}`} viewBox="0 0 12 12" fill="none">
                        <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    {openDropdown === item.label && (
                      <div className="ml-4 mt-1 space-y-0.5 bg-gray-50 dark:bg-[#1C1C1E] rounded-xl p-2 border border-gray-100 dark:border-gray-800">
                        {item.children.map(child => (
                          <button
                            key={child.id}
                            onClick={() => scrollTo(child.id)}
                            className="block w-full text-left px-4 py-2.5 text-sm rounded-lg text-gray-500 dark:text-gray-400 hover:text-white hover:bg-[#4C7F6E] transition-colors"
                          >
                            {child.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="border-t border-gray-200 dark:border-gray-800 pt-3 mt-3 px-4">
                <div className="flex items-center gap-2 justify-center">
                  <Link
                    href="/auth"
                    onClick={() => setMobileMenu(false)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-[#4C7F6E] hover:bg-[#3D6658] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                    </svg>
                    {t('land.nav.login')}
                  </Link>
                  <div className="flex items-center gap-1 pl-2 border-l border-gray-200 dark:border-gray-700">
                    <button
                      onClick={cycleLang}
                      className="w-9 h-9 flex items-center justify-center text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#2C2C2E] transition-colors tracking-wider"
                    >
                      {lang}
                    </button>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section className="max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
          {t('land.hero.title1')} <br />
          <span className="text-[#4C7F6E]">{t('land.hero.title2')}</span>
        </h1>
        <p className="text-lg md:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          {t('land.hero.subtitle')}
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => scrollTo('pricing')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-white bg-[#4C7F6E] hover:bg-[#3D6658] rounded-xl transition-all duration-200 shadow-sm hover:shadow-md w-full sm:w-auto"
          >
            {t('land.hero.start')}
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium text-gray-900 dark:text-white bg-[#F9F9FA]/90 dark:bg-[#121212] border border-[#4C7F6E] hover:bg-gray-100 dark:hover:bg-[#1C1C1E] rounded-xl transition-all duration-200 w-full sm:w-auto"
          >
            {t('land.hero.learnMore')}
          </button>
        </div>
      </section>

      <section id="mission" className="border-y border-[#4C7F6E]/30 dark:border-[#4C7F6E]/20 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#4C7F6E] bg-[#4C7F6E]/10 dark:bg-[#4C7F6E]/10 rounded-full border border-[#4C7F6E]/30">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                <path d="M8 1l2 4 4 .5-3 3 1 4.5-4-2-4 2 1-4.5-3-3L6 5l2-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {t('land.mission.badge')}
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center leading-tight">
            {t('land.mission.title1')} <br />
            <span className="text-[#4C7F6E]">{t('land.mission.title2')}</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="group p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-[#4C7F6E]/70 dark:border-[#4C7F6E]/20 shadow-sm hover:shadow-md hover:border-[#4C7F6E]/40 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#4C7F6E]/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2l3 6 6 1-4.5 4.5L18 20l-6-3-6 3 1.5-6.5L3 9l6-1 3-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-medium text-[#4C7F6E] uppercase tracking-wider">{t('land.mission.problemLabel')}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('land.mission.problemTitle')}</h3>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {t('land.mission.problemDesc')}
              </p>
            </div>
            <div className="group p-6 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl rounded-2xl border border-[#4C7F6E]/70 dark:border-[#4C7F6E]/20 shadow-sm hover:shadow-md hover:border-[#4C7F6E]/40 transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#4C7F6E]/10 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-6 h-6 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
                    <circle cx="12" cy="12" r="2" fill="currentColor"/>
                  </svg>
                </div>
                <div>
                  <div className="text-xs font-medium text-[#4C7F6E] uppercase tracking-wider">{t('land.mission.solutionLabel')}</div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('land.mission.solutionTitle')}</h3>
                </div>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {t('land.mission.solutionDesc')}
              </p>
            </div>
          </div>
          <div className="relative p-7 bg-gradient-to-br from-white/40 to-transparent dark:from-[#4C7F6E]/10 dark:to-transparent backdrop-blur-xl rounded-2xl border border-[#4C7F6E]/30 dark:border-[#4C7F6E]/30 shadow-sm overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#4C7F6E]/5 dark:bg-[#4C7F6E]/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
            <div className="relative flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-[#4C7F6E]/10 flex items-center justify-center shrink-0">
                <svg className="w-6 h-6 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none">
                  <path d="M2 20L12 10L17 15L22 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M18 6H22V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl" dangerouslySetInnerHTML={{ __html: t('land.mission.footer') }} />
            </div>
          </div>
        </div>
      </section>

      <section id="numbers" className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#4C7F6E] bg-[#4C7F6E]/10 dark:bg-[#4C7F6E]/10 rounded-full border border-[#4C7F6E]/30">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {t('land.numbers.badge')}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center" dangerouslySetInnerHTML={{ __html: t('land.numbers.title') }} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {numbersData.map((item, i) => (
            <div
              key={i}
              className="group relative text-center p-6 bg-white dark:bg-gray-900/60 backdrop-blur-xl rounded-2xl border border-[#4C7F6E]/30 dark:border-[#4C7F6E]/20 shadow-sm hover:shadow-xl hover:border-[#4C7F6E]/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#4C7F6E]/5 to-transparent dark:from-[#4C7F6E]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-[#4C7F6E]/15 to-[#4C7F6E]/5 dark:from-[#4C7F6E]/20 dark:to-[#4C7F6E]/5 rounded-xl group-hover:scale-110 transition-transform duration-300 ring-1 ring-[#4C7F6E]/20">
                  {item.icon === 'chart' && (
                    <svg className="w-7 h-7 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 3v18h18" />
                      <path d="M7 14l4-4 4 4 6-6" />
                      <path d="M17 7h4v4" />
                    </svg>
                  )}
                  {item.icon === 'uptime' && (
                    <svg className="w-7 h-7 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 3" />
                    </svg>
                  )}
                  {item.icon === 'speed' && (
                    <svg className="w-7 h-7 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
                    </svg>
                  )}
                  {item.icon === 'clock' && (
                    <svg className="w-7 h-7 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 7v5l3 2" />
                    </svg>
                  )}
                </div>
                <div className="text-3xl md:text-4xl font-black text-[#4C7F6E] mb-2 tracking-tight">
                  <AnimatedCounter value={item.value} />
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="community" className="border-t border-[#4C7F6E]/30 dark:border-[#4C7F6E]/20 py-20">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-2">
            {t('land.community.title1')}
          </h2>
          <p className="text-3xl md:text-4xl font-extrabold text-[#4C7F6E] mb-6">
            {t('land.community.title2')}
          </p>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            {t('land.community.subtitle')}
          </p>

          <div className="grid md:grid-cols-2 gap-6 text-left">
            <div className="group relative p-6 bg-white dark:bg-gray-900/60 rounded-2xl border border-[#4C7F6E]/40 dark:border-[#4C7F6E]/30 shadow-sm hover:shadow-lg hover:border-[#4C7F6E]/60 dark:hover:border-[#4C7F6E]/40 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#4C7F6E]/5 dark:bg-[#4C7F6E]/5 rounded-bl-[100px] transition-all duration-300 group-hover:bg-[#4C7F6E]/15" />
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-[#4C7F6E]/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#4C7F6E]/20 transition-all duration-300">
                  <svg className="w-5 h-5 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#4C7F6E] transition-colors">
                  {t('land.community.card1.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('land.community.card1.desc')}
                </p>
              </div>
            </div>

            <div className="group relative p-6 bg-white dark:bg-gray-900/60 rounded-2xl border border-[#4C7F6E]/40 dark:border-[#4C7F6E]/30 shadow-sm hover:shadow-lg hover:border-[#4C7F6E]/60 dark:hover:border-[#4C7F6E]/40 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#4C7F6E]/5 dark:bg-[#4C7F6E]/5 rounded-bl-[100px] transition-all duration-300 group-hover:bg-[#4C7F6E]/15" />
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-[#4C7F6E]/10 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#4C7F6E]/20 transition-all duration-300">
                  <svg className="w-5 h-5 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#4C7F6E] transition-colors">
                  {t('land.community.card2.title')}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {t('land.community.card2.desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-[#4C7F6E]/30 dark:border-[#4C7F6E]/20 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#4C7F6E] bg-[#4C7F6E]/10 dark:bg-[#4C7F6E]/10 rounded-full border border-[#4C7F6E]/30">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {t('land.features.badge')}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center" dangerouslySetInnerHTML={{ __html: t('land.features.title') }} />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresData.map((item, i) => (
              <div
                key={i}
                className="group relative p-6 bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-xl hover:border-[#4C7F6E]/40 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#4C7F6E]/5 to-transparent dark:from-[#4C7F6E]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#4C7F6E]/5 dark:bg-[#4C7F6E]/10 rounded-bl-[100px] transition-all duration-300 group-hover:bg-[#4C7F6E]/15" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#4C7F6E]/15 to-[#4C7F6E]/5 dark:from-[#4C7F6E]/20 dark:to-[#4C7F6E]/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:from-[#4C7F6E]/25 group-hover:to-[#4C7F6E]/10 transition-all duration-300 ring-1 ring-[#4C7F6E]/10">
                    <svg className="w-6 h-6 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d={item.svg} />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 group-hover:text-[#4C7F6E] transition-colors">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-4 py-20">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#4C7F6E] bg-[#4C7F6E]/10 dark:bg-[#4C7F6E]/10 rounded-full border border-[#4C7F6E]/30">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M6 6h4M6 10h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            {t('land.pricing.badge')}
          </span>
        </div>
        <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">{t('land.pricing.title')}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {pricingData.map((plan, i) => (
            <div
              key={i}
              className={`relative flex flex-col p-6 rounded-xl border shadow-sm transition-all duration-300 hover:shadow-lg overflow-hidden ${
                plan.popular
                  ? 'border-[#4C7F6E] bg-white/50 dark:bg-gray-900/60 backdrop-blur-xl ring-2 ring-[#4C7F6E]/40'
                  : 'border-[#4C7F6E]/70 bg-white/40 dark:bg-gray-900/50 backdrop-blur-xl hover:border-[#4C7F6E]'
              }`}
            >
              <div className="absolute -top-4 -right-4 text-[#4C7F6E]/10 dark:text-[#4C7F6E]/15 pointer-events-none">
                <svg className="w-20 h-20 md:w-24 md:h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d={plan.decor} />
                </svg>
              </div>

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</h3>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">{plan.desc}</p>
              <div className="mb-5 p-4 bg-gradient-to-br from-[#4C7F6E]/10 to-transparent dark:from-[#4C7F6E]/15 dark:to-transparent rounded-xl border border-[#4C7F6E]/15 dark:border-[#4C7F6E]/20">
                <div className="flex items-end justify-between">
                  <div className="flex items-baseline">
                    <span className="text-sm text-[#4C7F6E] font-bold self-start">$</span>
                    <span className="text-4xl font-black text-[#4C7F6E] tracking-tight leading-none">{plan.priceWeek}</span>
                    <span className="ml-1.5 text-xs text-gray-400 font-medium">{t('land.pricing.week')}</span>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline">
                      <span className="text-lg font-bold text-gray-700 dark:text-gray-300">${plan.priceMonth}</span>
                      <span className="ml-1 text-[10px] text-gray-400">{t('land.pricing.month')}</span>
                    </div>
                    <div className="text-[10px] text-green-500 font-semibold mt-0.5">
                      −{plan.saving}%
                    </div>
                  </div>
                </div>
              </div>
              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, j) => (
                  <li key={j} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 w-4 h-4 text-[#4C7F6E]">
                      {f.icon === 'refresh' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <path d="M2 8a6 6 0 0111.3-3M14 8a6 6 0 01-11.3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M14 2v4h-4M2 14v-4h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {f.icon === 'bell' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <path d="M8 1a5 5 0 00-5 5v2l-1 2h12l-1-2V6a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M6 13a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {f.icon === 'calculator' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <rect x="2" y="1" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M5 5h6M5 8h2M8 8h2M5 11h2M8 11h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                      {f.icon === 'chat' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <path d="M1 3a2 2 0 012-2h10a2 2 0 012 2v6a2 2 0 01-2 2H5l-3 3V3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {f.icon === 'ai' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1 1M11.5 11.5l1 1M3.5 12.5l1-1M11.5 4.5l1-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                      )}
                      {f.icon === 'history' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                      {f.icon === 'users' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                          <circle cx="11" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M1 14c0-3 2.5-4 5-4s5 1 5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M9 14c0-3 2-4 4-4s3 1 3 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                      {f.icon === 'book' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <path d="M2 3h4a2 2 0 012 2v8a2 2 0 00-2-2H2V3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M14 3h-4a2 2 0 00-2 2v8a2 2 0 012-2h4V3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {f.icon === 'search' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          <path d="M7 4v2M7 8v1M4 7h2M8 7h1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      )}
                      {f.icon === 'heart' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <path d="M8 13.5l-5.5-5A3.5 3.5 0 018 3.5a3.5 3.5 0 015.5 5L8 13.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {f.icon === 'alert' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <path d="M8 1L1 14h14L8 1z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M8 5v4M8 11v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                      {f.icon === 'bot' && (
                        <svg viewBox="0 0 16 16" fill="none">
                          <rect x="3" y="5" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                          <circle cx="6" cy="9" r="1" fill="currentColor"/>
                          <circle cx="10" cy="9" r="1" fill="currentColor"/>
                          <path d="M8 5V3M6 3h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                      )}
                    </span>
                    <span className="flex-1 flex items-center gap-1.5">
                      {f.text}
                      {f.tooltip && (
                        <span className="group relative shrink-0">
                          <svg className="w-4 h-4 text-gray-400 hover:text-[#4C7F6E] transition-colors cursor-help" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                            <circle cx="8" cy="8" r="2" fill="currentColor"/>
                          </svg>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-3 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-900 text-white text-xs rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 max-w-[280px] leading-relaxed whitespace-normal border border-gray-700/50">
                            <div className="relative">
                              {f.tooltip}
                              <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-8 border-transparent border-t-gray-800 dark:border-t-gray-900" />
                            </div>
                          </div>
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              <Link
                href="/auth"
                className={`block w-full text-center py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                  plan.popular
                    ? 'bg-[#4C7F6E] hover:bg-[#3D6658] text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-[#4C7F6E] hover:text-white text-gray-900 dark:text-white border border-transparent hover:border-[#4C7F6E]'
                }`}
              >
                {t('land.pricing.select')}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section id="products" className="max-w-6xl mx-auto px-4 py-20 border-t border-[#4C7F6E]/30 dark:border-[#4C7F6E]/20">
        <div className="flex justify-center mb-6">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#4C7F6E] bg-[#4C7F6E]/10 dark:bg-[#4C7F6E]/10 rounded-full border border-[#4C7F6E]/30">
            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
              <path d="M8 1l2 4 4 .5-3 3 1 4.5-4-2-4 2 1-4.5-3-3L6 5l2-4z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Продукты
          </span>
        </div>
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            Наши <span className="text-[#4C7F6E]">продукты</span>
          </h2>
          <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Все продукты проекта <span className="font-semibold text-[#4C7F6E]">Antarctic Alpha</span> — от торговли на фондовом рынке до инструментов в мире криптовалют
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Product 1: Бот с новостями */}
          <div className="group relative p-6 bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-[#4C7F6E]/40 transition-all duration-300 overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-5 text-[#4C7F6E]">
              <svg className="w-32 h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2a2 2 0 012 2v2.17A3 3 0 0117 9v6a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3V4a2 2 0 012-2h4z"/><path d="M9 21h6"/></svg>
            </div>
            <div className="w-14 h-14 bg-[#4C7F6E]/10 text-[#4C7F6E] rounded-2xl flex items-center justify-center mb-4 relative z-10">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2a2 2 0 012 2v2.17A3 3 0 0117 9v6a3 3 0 01-3 3H6a3 3 0 01-3-3V9a3 3 0 013-3V4a2 2 0 012-2h4z"/><path d="M9 21h6"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 relative z-10">Бот с новостями</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 relative z-10">Следи за ключевыми инсайтами и событиями рынка в реальном времени</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 italic relative z-10">Доступ к двум ботам — по фондовому рынку и по криптовалюте. Бонус: проверенные каналы и новостные ресурсы</p>
            <div className="space-y-2 mb-6 relative z-10">
              {[
                { duration: '1 месяц', price: '1 490 ₽' },
                { duration: '3 месяца', price: '3 490 ₽' },
                { duration: '6 месяцев', price: '7 490 ₽' },
                { duration: '12 месяцев', price: '14 490 ₽' },
              ].map((tier, idx) => {
                const isSelected = selectedProductTiers[1]?.duration === tier.duration;
                return (
                  <div key={idx} onClick={() => setSelectedProductTiers(prev => ({ ...prev, 1: tier }))}
                    className={`flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-[#4C7F6E]/5 rounded px-2 -mx-2 transition-all ${isSelected ? 'bg-[#4C7F6E]/10' : ''} border-gray-200 dark:border-gray-800`}>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{tier.duration}</span>
                    <span className={`font-bold ${isSelected ? 'text-[#4C7F6E]' : 'text-gray-600 dark:text-gray-400'}`}>{tier.price}</span>
                    {isSelected && <svg className="w-4 h-4 text-[#4C7F6E] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                );
              })}
            </div>
            <button className="w-full py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:text-[#4C7F6E] hover:border-[#4C7F6E] transition-all relative z-10 bg-transparent">
              Выбрать
            </button>
          </div>

          {/* Product 2: Бот с сигналами */}
          <div className="group relative p-6 bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-[#4C7F6E]/40 transition-all duration-300 overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-5 text-[#4C7F6E]">
              <svg className="w-32 h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <div className="w-14 h-14 bg-[#4C7F6E]/10 text-[#4C7F6E] rounded-2xl flex items-center justify-center mb-4 relative z-10">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 relative z-10">Бот с сигналами</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 relative z-10">Получай торговые сигналы и точки входа по нашим фильтрам</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 italic relative z-10">После выбора срока нажми кнопку «выбрать», откроется окно с выбором бота по сфере</p>
            <div className="space-y-2 mb-6 relative z-10">
              {[
                { duration: '1 месяц', price: '2 490 ₽' },
                { duration: '3 месяца', price: '5 490 ₽' },
                { duration: '6 месяцев', price: '9 490 ₽' },
                { duration: '12 месяцев', price: '16 490 ₽' },
              ].map((tier, idx) => {
                const isSelected = selectedProductTiers[2]?.duration === tier.duration;
                return (
                  <div key={idx} onClick={() => setSelectedProductTiers(prev => ({ ...prev, 2: tier }))}
                    className={`flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-[#4C7F6E]/5 rounded px-2 -mx-2 transition-all ${isSelected ? 'bg-[#4C7F6E]/10' : ''} border-gray-200 dark:border-gray-800`}>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{tier.duration}</span>
                    <span className={`font-bold ${isSelected ? 'text-[#4C7F6E]' : 'text-gray-600 dark:text-gray-400'}`}>{tier.price}</span>
                    {isSelected && <svg className="w-4 h-4 text-[#4C7F6E] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                );
              })}
            </div>
            <button onClick={() => {
              const tier = selectedProductTiers[2];
              if (tier) { setSelectedBotTier(tier); setBotModalOpen(true); }
            }} className="w-full py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:text-[#4C7F6E] hover:border-[#4C7F6E] transition-all relative z-10 bg-transparent">
              Выбрать
            </button>
          </div>

          {/* Product 3: Разбор сделок */}
          <div className="group relative p-6 bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-[#4C7F6E]/40 transition-all duration-300 overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-5 text-[#4C7F6E]">
              <svg className="w-32 h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            </div>
            <div className="w-14 h-14 bg-[#4C7F6E]/10 text-[#4C7F6E] rounded-2xl flex items-center justify-center mb-4 relative z-10">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 relative z-10">Разбор твоих сделок</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 relative z-10">Анализ твоих сделок с профессиональным трейдером сообщества</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4 italic relative z-10">Разбираем сделки со спотовой, фьючерсной, проп-торговлей, а также сделки с мемкоинами, кроме катапульты</p>
            <div className="space-y-2 mb-6 relative z-10">
              {[
                { duration: '10 шт', price: '4 410 ₽' },
                { duration: '20 шт', price: '7 840 ₽' },
                { duration: '30 шт', price: '10 290 ₽' },
                { duration: '40 шт', price: '11 760 ₽' },
              ].map((tier, idx) => {
                const isSelected = selectedProductTiers[3]?.duration === tier.duration;
                return (
                  <div key={idx} onClick={() => setSelectedProductTiers(prev => ({ ...prev, 3: tier }))}
                    className={`flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-[#4C7F6E]/5 rounded px-2 -mx-2 transition-all ${isSelected ? 'bg-[#4C7F6E]/10' : ''} border-gray-200 dark:border-gray-800`}>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{tier.duration}</span>
                    <span className={`font-bold ${isSelected ? 'text-[#4C7F6E]' : 'text-gray-600 dark:text-gray-400'}`}>{tier.price}</span>
                    {isSelected && <svg className="w-4 h-4 text-[#4C7F6E] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                );
              })}
            </div>
            <button className="w-full py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:text-[#4C7F6E] hover:border-[#4C7F6E] transition-all relative z-10 bg-transparent">
              Выбрать
            </button>
          </div>

          {/* Product 4: Доступ к чату */}
          <div className="group relative p-6 bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-[#4C7F6E]/40 transition-all duration-300 overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-5 text-[#4C7F6E]">
              <svg className="w-32 h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            </div>
            <div className="w-14 h-14 bg-[#4C7F6E]/10 text-[#4C7F6E] rounded-2xl flex items-center justify-center mb-4 relative z-10">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 relative z-10">Доступ к чату с опытными трейдерами</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 relative z-10">Сигналы, аналитика, совместные созвоны и общение с опытными трейдерами и основателями Antarctic Alpha</p>
            <div className="space-y-2 mb-6 relative z-10">
              {[
                { duration: '1 месяц', price: '7 900 ₽' },
              ].map((tier, idx) => {
                const isSelected = selectedProductTiers[4]?.duration === tier.duration;
                return (
                  <div key={idx} onClick={() => setSelectedProductTiers(prev => ({ ...prev, 4: tier }))}
                    className={`flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-[#4C7F6E]/5 rounded px-2 -mx-2 transition-all ${isSelected ? 'bg-[#4C7F6E]/10' : ''} border-gray-200 dark:border-gray-800`}>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{tier.duration}</span>
                    <span className={`font-bold ${isSelected ? 'text-[#4C7F6E]' : 'text-gray-600 dark:text-gray-400'}`}>{tier.price}</span>
                    {isSelected && <svg className="w-4 h-4 text-[#4C7F6E] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                );
              })}
            </div>
            <button className="w-full py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:text-[#4C7F6E] hover:border-[#4C7F6E] transition-all relative z-10 bg-transparent">
              Выбрать
            </button>
          </div>

          {/* Product 5: AMA-сессия */}
          <div className="group relative p-6 bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-[#4C7F6E]/40 transition-all duration-300 overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-5 text-[#4C7F6E]">
              <svg className="w-32 h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <div className="w-14 h-14 bg-[#4C7F6E]/10 text-[#4C7F6E] rounded-2xl flex items-center justify-center mb-4 relative z-10">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 relative z-10">Участие в AMA-сессии сообщества</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 relative z-10">Эксклюзивные эфиры с инсайтами, живая торговля, стратегиями и ответами от топовых трейдеров сообщества</p>
            <div className="space-y-2 mb-6 relative z-10">
              {[
                { duration: 'Участие', price: '1 990 ₽' },
              ].map((tier, idx) => {
                const isSelected = selectedProductTiers[5]?.duration === tier.duration;
                return (
                  <div key={idx} onClick={() => setSelectedProductTiers(prev => ({ ...prev, 5: tier }))}
                    className={`flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-[#4C7F6E]/5 rounded px-2 -mx-2 transition-all ${isSelected ? 'bg-[#4C7F6E]/10' : ''} border-gray-200 dark:border-gray-800`}>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{tier.duration}</span>
                    <span className={`font-bold ${isSelected ? 'text-[#4C7F6E]' : 'text-gray-600 dark:text-gray-400'}`}>{tier.price}</span>
                    {isSelected && <svg className="w-4 h-4 text-[#4C7F6E] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                );
              })}
            </div>
            <button className="w-full py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:text-[#4C7F6E] hover:border-[#4C7F6E] transition-all relative z-10 bg-transparent">
              Выбрать
            </button>
          </div>

          {/* Product 6: Сборка портфеля */}
          <div className="group relative p-6 bg-white dark:bg-gray-900/60 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg hover:border-[#4C7F6E]/40 transition-all duration-300 overflow-hidden">
            <div className="absolute right-[-20px] top-[-20px] opacity-5 text-[#4C7F6E]">
              <svg className="w-32 h-32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>
            </div>
            <div className="w-14 h-14 bg-[#4C7F6E]/10 text-[#4C7F6E] rounded-2xl flex items-center justify-center mb-4 relative z-10">
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 relative z-10">Сборка / анализ портфеля</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 relative z-10">Индивидуальный анализ и составление стратегии под твои цели, риск-профиль, формирование портфеля на среднесрок и дальнесрок</p>
            <div className="space-y-2 mb-6 relative z-10">
              {[
                { duration: 'Услуга', price: '12 000 ₽' },
              ].map((tier, idx) => {
                const isSelected = selectedProductTiers[6]?.duration === tier.duration;
                return (
                  <div key={idx} onClick={() => setSelectedProductTiers(prev => ({ ...prev, 6: tier }))}
                    className={`flex items-center justify-between py-2 border-b last:border-0 cursor-pointer hover:bg-[#4C7F6E]/5 rounded px-2 -mx-2 transition-all ${isSelected ? 'bg-[#4C7F6E]/10' : ''} border-gray-200 dark:border-gray-800`}>
                    <span className="text-sm text-gray-600 dark:text-gray-300">{tier.duration}</span>
                    <span className={`font-bold ${isSelected ? 'text-[#4C7F6E]' : 'text-gray-600 dark:text-gray-400'}`}>{tier.price}</span>
                    {isSelected && <svg className="w-4 h-4 text-[#4C7F6E] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>}
                  </div>
                );
              })}
            </div>
            <button className="w-full py-2.5 text-sm font-medium rounded-xl border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:text-[#4C7F6E] hover:border-[#4C7F6E] transition-all relative z-10 bg-transparent">
              Выбрать
            </button>
          </div>
        </div>
      </section>

      {/* Bot Selector Modal */}
      {botModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setBotModalOpen(false); setSelectedBotType(null); }} />
          <div className="relative bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-gray-800 shadow-2xl max-w-lg w-full p-8">
            <button onClick={() => { setBotModalOpen(false); setSelectedBotType(null); }}
              className="absolute -top-3 -right-3 w-10 h-10 flex items-center justify-center rounded-full bg-white dark:bg-[#1C1C1E] border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors shadow-lg">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#4C7F6E] to-[#4C7F6E]/70 rounded-2xl mb-4 shadow-lg shadow-[#4C7F6E]/20">
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Выберите бота с сигналами</h3>
              {selectedBotTier && (
                <div className="inline-flex items-center gap-3 bg-[#4C7F6E]/10 border border-[#4C7F6E]/20 px-5 py-2 rounded-full mt-3">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">Тариф:</span>
                  <span className="text-[#4C7F6E] font-bold">{selectedBotTier.duration}</span>
                  <span className="text-gray-400">•</span>
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{selectedBotTier.price}</span>
                </div>
              )}
            </div>
            <div className="space-y-3 mb-8">
              {[
                { id: 'memecoins', title: 'Мемкоины', desc: 'Сигналы по мемкоинам с высоким потенциалом (40%-x2)', color: 'purple' },
                { id: 'markets', title: 'Markets', desc: 'Фьючерсы и спот-торговля на основных биржах с точными точками входа', color: 'blue' },
                { id: 'polymarket', title: 'Polymarket', desc: 'Прогнозы на события реального мира и информационные рынки', color: 'amber' },
              ].map(bot => {
                const isSelected = selectedBotType === bot.id;
                const colorMap: Record<string, { bg: string; text: string; light: string }> = {
                  purple: { bg: 'bg-purple-500', text: 'text-purple-400', light: 'bg-purple-500/20' },
                  blue: { bg: 'bg-blue-500', text: 'text-blue-400', light: 'bg-blue-500/20' },
                  amber: { bg: 'bg-amber-500', text: 'text-amber-400', light: 'bg-amber-500/20' },
                };
                const c = colorMap[bot.color];
                return (
                  <button key={bot.id} onClick={() => setSelectedBotType(bot.id)}
                    className={`w-full p-4 border-2 rounded-2xl flex items-center gap-4 transition-all text-left ${isSelected ? 'border-[#4C7F6E] bg-[#4C7F6E]/5' : 'border-gray-200 dark:border-gray-700 hover:border-[#4C7F6E]/50 hover:bg-[#4C7F6E]/5'}`}>
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${isSelected ? c.bg + ' text-white shadow-lg' : c.light + ' ' + c.text}`}>
                      {bot.id === 'memecoins' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M23 6l-9.5 5.5-9.5-5.5"/><path d="M23 12l-9.5 5.5-9.5-5.5"/><path d="M23 18l-9.5 5.5-9.5-5.5"/></svg>}
                      {bot.id === 'markets' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>}
                      {bot.id === 'polymarket' && <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 dark:text-white">{bot.title}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{bot.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="w-8 h-8 bg-[#4C7F6E] rounded-full flex items-center justify-center shrink-0">
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="pt-6 border-t border-gray-200 dark:border-gray-800">
              <button
                disabled={!selectedBotType}
                onClick={() => { console.log('Выбран бот:', selectedBotType, 'Тариф:', selectedBotTier); setBotModalOpen(false); setSelectedBotType(null); }}
                className="w-full py-3.5 text-base font-bold text-white bg-gradient-to-r from-[#4C7F6E] to-[#4C7F6E]/80 rounded-xl transition-all shadow-lg shadow-[#4C7F6E]/25 disabled:opacity-40 disabled:cursor-not-allowed hover:from-[#4C7F6E]/90 hover:to-[#4C7F6E]/70"
              >
                {selectedBotType ? 'Оформить подписку' : 'Выберите бота для продолжения'}
              </button>
            </div>
          </div>
        </div>
      )}

      <section id="faq" className="border-y border-[#4C7F6E]/30 dark:border-[#4C7F6E]/20 py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center mb-8">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-[#4C7F6E] bg-[#4C7F6E]/10 dark:bg-[#4C7F6E]/10 rounded-full border border-[#4C7F6E]/30">
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M8 5v4M8 11v0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              {t('land.faq.badge')}
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-12 text-center">{t('land.faq.title')}</h2>
          <div className="space-y-4">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/30 backdrop-blur-sm overflow-hidden transition-all duration-300 hover:border-[#4C7F6E]/30 hover:shadow-lg hover:shadow-[#4C7F6E]/5"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center gap-4 px-6 py-5 text-left"
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 shrink-0 ${
                    openFaq === i
                      ? 'bg-[#4C7F6E] text-white shadow-md shadow-[#4C7F6E]/30 scale-110'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:bg-[#4C7F6E]/10 group-hover:text-[#4C7F6E]'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 font-medium text-gray-900 dark:text-white text-sm md:text-base">
                    {item.q}
                  </span>
                  <svg
                    className={`w-5 h-5 shrink-0 transition-all duration-300 text-gray-400 ${
                      openFaq === i ? 'rotate-180 text-[#4C7F6E]' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    openFaq === i
                      ? 'max-h-96 opacity-100'
                      : 'max-h-0 opacity-0'
                  }`}
                >
                  <div className="px-6 pb-5 pt-0 ml-12 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                      {item.a}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-2xl max-w-md w-full p-8 text-center">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors"
              aria-label={t('land.modal.close')}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#4C7F6E]/10 flex items-center justify-center">
              <svg className="w-7 h-7 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t('land.modal.title')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
              {t('land.modal.subtitle')}
            </p>
            <div className="grid grid-cols-2 gap-3">
              <a
                href="https://t.me/antarctic_alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-900 dark:text-white bg-[#F9F9FA]/90 dark:bg-[#121212] border border-[#4C7F6E] hover:bg-gray-100 dark:hover:bg-[#1C1C1E] rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                {t('social.telegram')}
              </a>
              <a
                href="https://vk.com/antarctic_alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-900 dark:text-white bg-[#F9F9FA]/90 dark:bg-[#121212] border border-[#4C7F6E] hover:bg-gray-100 dark:hover:bg-[#1C1C1E] rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.523-2.049-1.712-1.033-1.033-1.49-1.171-1.744-1.171-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4 8.673 4 8.231c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.305-.491.745-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.49-.085.744-.576.744z"/>
                </svg>
                {t('social.vk')}
              </a>
              <a
                href="https://x.com/antarctic_alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-900 dark:text-white bg-[#F9F9FA]/90 dark:bg-[#121212] border border-[#4C7F6E] hover:bg-gray-100 dark:hover:bg-[#1C1C1E] rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                {t('social.x')}
              </a>
              <a
                href="https://youtube.com/@antarctic_alpha"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-900 dark:text-white bg-[#F9F9FA]/90 dark:bg-[#121212] border border-[#4C7F6E] hover:bg-gray-100 dark:hover:bg-[#1C1C1E] rounded-xl transition-all duration-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                {t('social.youtube')}
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
