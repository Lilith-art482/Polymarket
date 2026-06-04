'use client';

import { useT } from '@/lib/useT';

const topicKey: Record<string, string> = {
  Политика: 'topic.politics',
  Геополитика: 'topic.geopolitics',
  Спорт: 'topic.sports',
  Финансы: 'topic.finance',
  Технологии: 'topic.technology',
  Погода: 'topic.weather',
};

export function PlaceholderPage({ title }: { title: string }) {
  const { t } = useT();

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 shadow-sm">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">{title}</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {t('placeholder.desc', { topic: t(topicKey[title] || 'topic.politics') })}
          </p>
        </div>
      </div>
    </main>
  );
}
