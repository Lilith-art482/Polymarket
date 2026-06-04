'use client';

import { useState, useEffect } from 'react';
import { useT } from '@/lib/useT';

interface SignalCardProps {
  symbol: string;
  timeframe: string;
  marketId: string;
  signal: {
    verdict: string;
    emoji: string;
    positiveCount: number;
    details: Record<string, string>;
  };
  pm: { up: number; down: number; spread: number; endDate: string };
  price: number;
  ind: {
    rsi: number;
    macdHist: number;
    prevMacdHist: number;
    ema9: number;
    ema21: number;
    vwap: number;
    atr: number;
    hl10High: number;
    hl10Low: number;
    price: number;
    bbUpper: number;
    bbLower: number;
    bbPercentB: number;
    adx: number;
    plusDI: number;
    minusDI: number;
    obvSlope: number;
    mfi: number;
  };
  atrPct: number;
  session: {
    name: string;
    emoji: string;
    sessionTime: string;
    totalMinutes: number;
    currentMin: string;
  };
  volEmoji: string;
  volComment: string;
  atrValue: string;
}

const indicatorMeta: Record<string, string> = {
  rsi: 'RSI',
  macd: 'MACD',
  ema: 'EMA',
  vwap: 'VWAP',
  pivots: 'Pivots',
  bb: 'BB %B',
  adx: 'ADX',
  obv: 'OBV',
  mfi: 'MFI',
};

const verdictConfig: Record<string, { accent: string; badge: string; text: string }> = {
  UP: { accent: 'bg-green-500', badge: 'bg-green-500 text-white', text: 'text-green-600 dark:text-green-400' },
  DOWN: { accent: 'bg-red-500', badge: 'bg-red-500 text-white', text: 'text-red-600 dark:text-red-400' },
  NEUTRAL: { accent: 'bg-yellow-500', badge: 'bg-yellow-500 text-white', text: 'text-yellow-600 dark:text-yellow-400' },
};

const volConfig: Record<string, { badge: string; label: string }> = {
  '🟢': { badge: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', label: 'Золотая зона' },
  '🟡': { badge: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', label: 'Низкая' },
  '🔴': { badge: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400', label: 'Высокая' },
};

function indicatorType(text: string): 'positive' | 'negative' | 'neutral' {
  if (text.startsWith('✅')) return 'positive';
  if (text.startsWith('❌')) return 'negative';
  return 'neutral';
}

function indicatorValue(text: string): string {
  return text.replace(/^[✅❌⚪]\s*/, '').trim();
}

export function SignalCard({
  symbol,
  timeframe,
  marketId,
  signal,
  pm,
  price,
  session,
  volEmoji,
  volComment,
  atrValue,
}: SignalCardProps) {
  const { t } = useT();

  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!pm.endDate) return;
    function update() {
      const diff = new Date(pm.endDate).getTime() - Date.now();
      if (diff <= 0) { setCountdown('—'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setCountdown(`${h}ч ${m}м`);
      else if (m > 0) setCountdown(`${m}м ${s}с`);
      else setCountdown(`${s}с`);
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [pm.endDate]);

  const totalIndicators = Object.keys(indicatorMeta).length;
  const verdictStyle = verdictConfig[signal.verdict] || verdictConfig.NEUTRAL;
  const indicatorEntries = Object.entries(indicatorMeta);
  const volStyle = volConfig[volEmoji] || volConfig['🟢'];

  return (
    <div className="bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl rounded-2xl border border-[#4C7F6E] dark:border-[#2C2C2E] shadow-xl overflow-hidden">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
              {symbol}/USDT
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-medium text-white bg-[#4C7F6E] px-2.5 py-0.5 rounded-full">
                {timeframe}
              </span>
              {marketId && (
                <span className="text-[11px] text-gray-500 dark:text-gray-500 font-mono bg-gray-100 dark:bg-[#2C2C2E] px-2 py-0.5 rounded">
                  #{marketId}
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-gray-500 dark:text-gray-500 font-medium uppercase tracking-wider">Цена</div>
            <div className="text-lg font-bold font-mono text-gray-900 dark:text-white">
              ${price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2C2C2E]">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              {session.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
              {session.sessionTime} · {session.totalMinutes} мин
            </div>
          </div>
          {pm.endDate && (
            <div className="text-sm font-mono font-semibold text-gray-900 dark:text-white">
              ⏱ {countdown}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2C2C2E]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">{t('indicators')}</h3>
          <span className="text-xs text-gray-500 dark:text-gray-500">{signal.positiveCount}/{totalIndicators} бычьих</span>
        </div>

        <div className="mb-5">
          <div className="flex gap-0.5 h-2 rounded-full overflow-hidden bg-gray-100 dark:bg-[#2C2C2E]">
            {indicatorEntries.map(([key]) => {
              const text = signal.details[key] || '';
              const type = indicatorType(text);
              return (
                <div
                  key={key}
                  className={`flex-1 transition-colors duration-300 ${
                    type === 'positive' ? 'bg-green-500' :
                    type === 'negative' ? 'bg-red-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                  title={indicatorValue(text)}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-400 dark:text-gray-600">
            <span>медвежий</span>
            <span>бычий</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {indicatorEntries.map(([key, label]) => {
            const text = signal.details[key] || '';
            const type = indicatorType(text);
            const value = indicatorValue(text);
            const borderColor = type === 'positive' ? 'border-green-500/40 dark:border-green-500/30' :
              type === 'negative' ? 'border-red-500/40 dark:border-red-500/30' :
              'border-gray-200 dark:border-gray-700';
            const badgeBg = type === 'positive' ? 'bg-green-500' :
              type === 'negative' ? 'bg-red-500' :
              'bg-gray-300 dark:bg-gray-600';

            return (
              <div
                key={key}
                className={`rounded-xl border ${borderColor} bg-white/50 dark:bg-[#121212]/50 backdrop-blur-sm p-3.5 transition-all duration-200 hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-500 uppercase tracking-wider">{label}</span>
                  <span className={`inline-block w-2 h-2 rounded-full ${badgeBg}`} />
                </div>
                <div className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{value}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-6 py-4 border-b border-gray-100 dark:border-[#2C2C2E]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-900 dark:text-white font-medium">ATR</span>
            <span className="text-sm font-mono text-gray-900 dark:text-white font-semibold">${atrValue}</span>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${volStyle.badge}`}>
            {volStyle.label}
          </span>
        </div>
      </div>

      <div className="px-6 py-5 border-b border-gray-100 dark:border-[#2C2C2E]">
        <div className="flex items-stretch gap-4">
          <div className={`w-1.5 rounded-full ${verdictStyle.accent}`} />
          <div className="flex-1">
            <div className="text-[11px] text-gray-500 dark:text-gray-500 font-semibold uppercase tracking-widest mb-2">{t('verdict')}</div>
            <div className="flex items-center gap-3">
              <span className="text-3xl leading-none">{signal.verdict === 'UP' ? '🟢' : signal.verdict === 'DOWN' ? '🔴' : '⚪'}</span>
              <div>
                <div className={`text-lg font-bold ${verdictStyle.text}`}>{signal.verdict}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{signal.positiveCount}/{totalIndicators} бычьих</div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
