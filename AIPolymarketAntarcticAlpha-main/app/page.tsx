'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import useSWR from 'swr';
import { SignalCard } from '@/components/SignalCard';
import { CustomSelect, type SelectOption } from '@/components/CustomSelect';
import { useT } from '@/lib/useT';
import { useAuth } from '@/app/providers';
import { saveAnalysis, subscribeHistory, cleanupHistory, cleanupOldHistory, deleteAnalysis, type AnalysisDoc } from '@/lib/firebase';

interface Params {
  symbol: string;
  timeframe: string;
  marketId: string;
  url: string;
  marketUrl: string;
}

function AssetIcon({ symbol }: { symbol: string }) {
  return (
    <Image
      src={`/${symbol.toLowerCase()}.webp`}
      alt={symbol}
      width={20}
      height={20}
      className="w-5 h-5 shrink-0"
    />
  );
}

function ClockIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 text-gray-400" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function Checkbox({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all duration-150 ${
        checked
          ? 'bg-[#4C7F6E] border-[#4C7F6E] shadow-sm'
          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1C1C1E] hover:border-[#4C7F6E]'
      }`}
    >
      {checked && (
        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
          <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}

const assetOptions: SelectOption[] = [
  { value: 'BTC', label: 'BTC', icon: <AssetIcon symbol="BTC" /> },
  { value: 'ETH', label: 'ETH', icon: <AssetIcon symbol="ETH" /> },
  { value: 'SOL', label: 'SOL', icon: <AssetIcon symbol="SOL" /> },
  { value: 'XRP', label: 'XRP', icon: <AssetIcon symbol="XRP" /> },
  { value: 'BNB', label: 'BNB', icon: <AssetIcon symbol="BNB" /> },
  { value: 'DOGE', label: 'DOGE', icon: <AssetIcon symbol="DOGE" /> },
];

const timeframeOptions: SelectOption[] = [
  { value: '5min', label: '5m', icon: <ClockIcon /> },
  { value: '15min', label: '15m', icon: <ClockIcon /> },
];

const fetcher = async (params: Params) => {
  const res = await fetch('/api/signals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
};

function AlertsTab({ assetOptions }: { assetOptions: SelectOption[] }) {
  const [selectedAsset, setSelectedAsset] = useState<string>('ALL');
  const [alertsData, setAlertsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAlertsData = async () => {
    setLoading(true);
    try {
      const symbol = selectedAsset === 'ALL' ? 'BTC' : selectedAsset;
      const res = await fetch(
        `/api/alerts-data?symbol=${symbol}&timeframe=5min&limit=1000&mode=all`
      );
      const data = await res.json();
      if (data.data) {
        // Фильтруем по выбранному активу
        let filtered = data.data;
        if (selectedAsset !== 'ALL') {
          filtered = data.data.filter((item: any) => item.symbol === selectedAsset);
        }
        setAlertsData(filtered);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch alerts data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlertsData();
  }, [selectedAsset]);

  // Автоматическое обновление каждые 10 секунд
  useEffect(() => {
    const interval = setInterval(fetchAlertsData, 10000);
    return () => clearInterval(interval);
  }, [selectedAsset]);

  const exportCSV = () => {
    if (alertsData.length === 0) return;
    
    const headers = ['Время рынка', 'Актив', 'Цена открытия', 'Цена закрытия', '% изменения', 'URL рынка', 'Статус'];
    const rows = alertsData.map(item => [
      new Date(item.windowStart * 1000).toLocaleString('ru-RU'),
      item.symbol,
      item.openPrice.toFixed(4),
      item.closePrice !== null ? item.closePrice.toFixed(4) : '-',
      item.changePercent.toFixed(2) + '%',
      item.marketUrl,
      item.isExpired ? 'Завершен' : 'Активен',
    ]);
    
    const bom = '\uFEFF';
    const csv = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts-${selectedAsset}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getChangeBg = (change: number) => {
    if (change > 0) return 'bg-green-50 dark:bg-green-900/20';
    if (change < 0) return 'bg-red-50 dark:bg-red-900/20';
    return 'bg-gray-50 dark:bg-gray-800';
  };

  const assetButtons = [
    { value: 'ALL', label: 'ВСЕ', icon: null },
    ...assetOptions,
  ];

  return (
    <div className="space-y-4">
      {/* Header with selectors */}
      <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm">
        <div className="flex flex-col gap-4">
          {/* Asset selector */}
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
              Актив
            </label>
            <div className="flex flex-wrap gap-2">
              {assetButtons.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setSelectedAsset(opt.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                    selectedAsset === opt.value
                      ? 'bg-[#4C7F6E] text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3C3C3E]'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Info and controls */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#2C2C2E]">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>{alertsData.length} рынков</span>
              </div>
              
              <div className="flex items-center gap-1.5">
                <span className="relative flex w-2 h-2">
                  <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  Авто-обновление
                </span>
              </div>
              
              {lastUpdated && (
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  • Обновлено: {lastUpdated.toLocaleTimeString('ru-RU')}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchAlertsData}
                disabled={loading}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  loading
                    ? 'bg-gray-200 dark:bg-[#2C2C2E] text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#3C3C3E]'
                }`}
              >
                <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 16 16" fill="none">
                  <path d="M8 2a6 6 0 106 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M14 2v4h-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                {loading ? 'Загрузка...' : 'Обновить'}
              </button>
              
              {alertsData.length > 0 && (
                <button
                  onClick={exportCSV}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-[#4C7F6E] hover:bg-[#3D6658] rounded-lg transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                    <path d="M3 10l4 4 4-4M7 14V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Экспорт CSV
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && alertsData.length === 0 && (
        <div className="bg-white dark:bg-[#1C1C1E] p-12 rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-[#4C7F6E]/20 border-t-[#4C7F6E] rounded-full animate-spin mb-4" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Загрузка данных рынков...</p>
        </div>
      )}

      {/* Data table */}
      {!loading && alertsData.length > 0 && (
        <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-[#2C2C2E] bg-gray-50 dark:bg-[#1C1C1E]">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    №
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Время рынка
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Актив
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Цена открытия
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Цена закрытия
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    % изменения
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-[#2C2C2E]">
                {alertsData.slice(0, 1000).map((item, index) => (
                  <tr 
                    key={item.id} 
                    className="hover:bg-gray-50 dark:hover:bg-[#2C2C2E]/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 font-mono">
                      {alertsData.length - index}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <svg className="w-3.5 h-3.5 text-gray-400" viewBox="0 0 20 20" fill="none">
                          <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
                          <path d="M10 6v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {new Date(item.windowStart * 1000).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-[#2C2C2E] text-gray-900 dark:text-white">
                        <Image
                          src={`/${item.symbol.toLowerCase()}.webp`}
                          alt={item.symbol}
                          width={14}
                          height={14}
                          className="w-3.5 h-3.5"
                        />
                        {item.symbol}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-700 dark:text-gray-300">
                      {item.openPrice.toFixed(4)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-gray-900 dark:text-white">
                      {item.closePrice !== null ? item.closePrice.toFixed(4) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.closePrice !== null ? (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${getChangeBg(item.changePercent)} ${getChangeColor(item.changePercent)}`}>
                          {item.changePercent > 0 ? '↑' : item.changePercent < 0 ? '↓' : '−'} 
                          {Math.abs(item.changePercent).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {item.isExpired ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                          ✓ Завершен
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <a
                        href={item.marketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-[#4C7F6E] hover:bg-[#3D6658] rounded-lg transition-colors shadow-sm"
                      >
                        <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
                          <path d="M10 3h3v3M13 3L7 9M6 4H4a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Polymarket
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="px-4 py-3 border-t border-gray-100 dark:border-[#2C2C2E] bg-gray-50 dark:bg-[#1C1C1E]">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Показано {Math.min(alertsData.length, 1000)} из {alertsData.length} рынков</span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                </svg>
                Авто-обновление каждые 10с
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && alertsData.length === 0 && (
        <div className="bg-white dark:bg-[#1C1C1E] p-12 rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-[#2C2C2E] rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 17h6M10 9l2-2 2 2M5 13a7 7 0 1114 0v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4z"/>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Нет данных о рынках
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Система автоматически отслеживает новые рынки Polymarket. Данные появятся сразу после создания рынка.
          </p>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const userId = user?.uid || '';
  const [params, setParams] = useState<Params>({
    symbol: '',
    timeframe: '',
    marketId: '',
    url: '',
    marketUrl: '',
  });
  const { t } = useT();
  function RefreshIcon({ active }: { active: boolean }) {
    return (
      <svg className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-green-500' : 'text-gray-400'}`} viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  const refreshOptions: SelectOption[] = [
    { value: '0', label: 'Выкл', icon: <RefreshIcon active={false} /> },
    { value: '30000', label: '30с', icon: <RefreshIcon active={true} /> },
    { value: '60000', label: '60с', icon: <RefreshIcon active={true} /> },
    { value: '90000', label: '90с', icon: <RefreshIcon active={true} /> },
    { value: '300000', label: '5мин', icon: <RefreshIcon active={true} /> },
  ];
  const [refreshInterval, setRefreshInterval] = useState<number>(0);

  const [urlCopied, setUrlCopied] = useState(false);
  const [history, setHistory] = useState<AnalysisDoc[]>([]);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterTimeframe, setFilterTimeframe] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('');
  const [filterResult, setFilterResult] = useState('');
  const [activeTab, setActiveTab] = useState<'alerts' | 'manual'>('manual');

  const filteredHistory = useMemo(() => {
    return history.filter(entry => {
      if (filterSymbol && entry.symbol !== filterSymbol) return false;
      if (filterTimeframe && entry.timeframe !== filterTimeframe) return false;
      if (filterVerdict && entry.signal?.verdict !== filterVerdict) return false;
      if (filterResult) {
        const endDate = entry.pm?.endDate;
        const isExpired = endDate ? new Date(endDate).getTime() < Date.now() : false;
        const actualResult = isExpired
          ? (entry.pm.up > entry.pm.down ? 'UP' : entry.pm.down > entry.pm.up ? 'DOWN' : null)
          : null;
        if (filterResult === 'UP' && actualResult !== 'UP') return false;
        if (filterResult === 'DOWN' && actualResult !== 'DOWN') return false;
        if (filterResult === 'waiting' && (actualResult !== null || isExpired)) return false;
      }
      return true;
    });
  }, [history, filterSymbol, filterTimeframe, filterVerdict, filterResult]);

  const uniqueSymbols = useMemo(() => {
    const symbols = new Set(history.map(e => e.symbol).filter(Boolean));
    return Array.from(symbols).sort();
  }, [history]);

  const pendingSaveRef = useRef(0);
  const handleAnalyzeRef = useRef<() => Promise<void>>(async () => {});

  const exportCSV = () => {
    try {
      if (history.length === 0) return;
      const headers = ['ID', 'Актив', 'Таймфрейм', 'Вердикт', 'Счёт', 'RSI', 'MACD', 'EMA9', 'EMA21', 'VWAP', 'BB %B', 'ADX', 'OBV', 'ATR', 'Цена', 'URL рынка', 'Дата'];
      const rows = history.map(e => [
        e.id || '',
        e.symbol || '',
        e.timeframe || '',
        e.signal?.verdict || '',
        (e.signal?.positiveCount ?? '') + '/8',
        e.ind?.rsi ?? '',
        e.ind?.macdHist?.toFixed?.(4) ?? '',
        e.ind?.ema9?.toFixed?.(2) ?? '',
        e.ind?.ema21?.toFixed?.(2) ?? '',
        e.ind?.vwap?.toFixed?.(2) ?? '',
        e.ind?.bbPercentB?.toFixed?.(2) ?? '',
        e.ind?.adx?.toFixed?.(0) ?? '',
        e.ind?.obvSlope?.toFixed?.(0) ?? '',
        e.atrValue || '',
        e.price ?? '',
        e.polymarketUrl || '',
        e.createdAt ? new Date(e.createdAt.seconds * 1000).toLocaleString('ru-RU') : '',
      ]);
      const bom = '\uFEFF';
      const csv = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `antarctic-alpha-history-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Export CSV failed:', err);
    }
  };

  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeHistory(userId, (entries) => {
      setHistory(entries);
    }, 30);
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    cleanupOldHistory();
  }, []);

  const copyUrl = async () => {
    if (!params.url) return;
    try {
      await navigator.clipboard.writeText(params.url);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {}
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredHistory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredHistory.map(e => e.id)));
    }
  };

  const deleteSelected = async () => {
    for (const id of Array.from(selectedIds)) {
      await deleteAnalysis(id);
    }
    setSelectedIds(new Set());
  };

  const deleteAll = async () => {
    for (const entry of history) {
      await deleteAnalysis(entry.id);
    }
    setSelectedIds(new Set());
  };

  const { data, error, mutate } = useSWR(
    hasAnalyzed && params.symbol && params.timeframe ? params : null,
    fetcher,
    {
      refreshInterval,
      revalidateOnFocus: false,
      revalidateIfStale: true,
    }
  );

  const { data: livePm } = useSWR(
    params.marketId ? `/api/polymarket-prices?marketId=${params.marketId}` : null,
    async (url: string) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch prices');
      return res.json();
    },
    {
      refreshInterval: 5000,
      revalidateOnFocus: false,
    }
  );

  useEffect(() => {
    if (!data || data.error || !pendingSaveRef.current) {
      console.log('[save] skip:', { hasData: !!data, hasError: data?.error, pending: pendingSaveRef.current });
      return;
    }
    const gen = pendingSaveRef.current;
    pendingSaveRef.current = 0;
    console.log('[save] saving analysis...', { symbol: params.symbol, timeframe: params.timeframe });
    if (!userId) return;
    saveAnalysis(userId, {
      symbol: params.symbol,
      timeframe: params.timeframe,
      marketId: params.marketId,
      signal: data.signal,
      pm: data.pm || { up: 0, down: 0, spread: 0, endDate: '' },
      price: data.price,
      ind: data.ind,
      atrPct: data.atrPct,
      atrValue: data.atrValue,
      session: data.session,
      volEmoji: data.volEmoji,
      volComment: data.volComment,
      polymarketUrl: params.marketUrl || data.polymarketUrl,
    }).then(() => {
      if (userId) cleanupHistory(userId, 30);
    });
  }, [data, userId]);

  const handleAnalyze = async () => {
    if (!params.symbol || !params.timeframe) return;
    console.log('[analyze] starting', { symbol: params.symbol, timeframe: params.timeframe });
    const res = await fetch(`/api/polymarket-search?symbol=${params.symbol}&timeframe=${params.timeframe}`);
    const d = await res.json();
    console.log('[analyze] search result', { markets: d.markets?.length });
    setHasAnalyzed(true);
    if (d.markets && d.markets.length > 0) {
      const m = d.markets[0];
      setParams(p => ({ ...p, marketId: m.id, marketUrl: m.url, url: m.url }));
    }
    pendingSaveRef.current = Date.now();
    console.log('[analyze] pendingSaveRef set, calling mutate');
    mutate();
  };

  useEffect(() => {
    handleAnalyzeRef.current = handleAnalyze;
  });

  useEffect(() => {
    if (!params.symbol || !params.timeframe) return;
    handleAnalyzeRef.current();
  }, [params.symbol, params.timeframe]);

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-[#121212]">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {t('signals')}
        </h1>

        <div className="flex p-1 bg-gray-100 dark:bg-[#1C1C1E] rounded-xl border border-gray-200 dark:border-[#2C2C2E] w-fit">
          <button
            onClick={() => setActiveTab('alerts')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'alerts'
                ? 'bg-[#4C7F6E] text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Alerts
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'manual'
                ? 'bg-[#4C7F6E] text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Ручной анализ
          </button>
        </div>

        {activeTab === 'alerts' ? (
          <AlertsTab assetOptions={assetOptions} />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#2C2C2E]">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" viewBox="0 0 20 20" fill="none">
                      <path d="M12.586 4.586a2 2 0 112.828 2.828l-1.414 1.414a2 2 0 01-2.828-2.828l1.414-1.414zM10 2a8 8 0 100 16 8 8 0 000-16zM10 14a4 4 0 110-8 4 4 0 010 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                      {t('parameters')}
                    </h2>
                  </div>
                  <label className="flex items-center gap-2 text-xs text-gray-400">
                    {refreshInterval > 0 && (
                      <span className="relative flex w-2 h-2">
                        <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex w-2 h-2 rounded-full bg-green-500" />
                      </span>
                    )}
                    <CustomSelect
                      options={refreshOptions}
                      value={String(refreshInterval)}
                      onChange={value => setRefreshInterval(Number(value))}
                      placeholder="Авто"
                    />
                  </label>
                </div>

                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  {t('asset')}
                  <div className="mt-1.5">
                    <CustomSelect
                      options={assetOptions}
                      value={params.symbol}
                      onChange={value => setParams(p => ({ ...p, symbol: value, marketId: '', marketUrl: '', url: '' }))}
                      placeholder="BTC, ETH, SOL..."
                    />
                  </div>
                </label>

                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  {t('timeframe')}
                  <div className="mt-1.5">
                    <CustomSelect
                      options={timeframeOptions}
                      value={params.timeframe}
                      onChange={value => setParams(p => ({ ...p, timeframe: value, marketId: '', marketUrl: '', url: '' }))}
                      placeholder="5m, 15m..."
                    />
                  </div>
                </label>

                <label className="block text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-between">
                    <span>{t('marketUrl')}</span>
                    {params.url && (
                      <button
                        onClick={copyUrl}
                        className="flex items-center gap-1 text-xs text-gray-400 hover:text-green-500 transition-colors"
                      >
                        {urlCopied ? (
                          <span className="text-green-500">✓</span>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                          </svg>
                        )}
                        {urlCopied ? 'Скопирован' : 'Копировать'}
                      </button>
                    )}
                  </div>
                  <input
                    placeholder={t('autoPopulated')}
                    value={params.url}
                    readOnly
                    onClick={copyUrl}
                    className="mt-1.5 border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2.5 w-full rounded-lg text-sm outline-none placeholder-gray-400 dark:placeholder-gray-600 cursor-pointer"
                  />
                  {params.marketId && (
                    <span className="mt-1 text-[11px] text-gray-400 dark:text-gray-600 block">
                      ID: {params.marketId}
                    </span>
                  )}
                </label>

                {(params.marketUrl || params.symbol) && (
                  <div className="pt-4 border-t border-gray-100 dark:border-[#2C2C2E]">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-3">{t('links')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {params.marketUrl && (
                        <a
                          href={params.marketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4C7F6E] hover:bg-[#3D6658] text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M8 4v8M4 8h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          Polymarket ↗
                        </a>
                      )}
                      {params.symbol && (
                        <>
                          <a
                            href={`https://www.mexc.com/ru-RU/exchange/${params.symbol}_USDT`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4C7F6E] hover:bg-[#3D6658] text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                              <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                              <path d="M6 5v6M10 5v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            MEXC ↗
                          </a>
                          <a
                            href={`https://bingx.com/ru/spot/${params.symbol}USDT`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#4C7F6E] hover:bg-[#3D6658] text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
                          >
                            <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                              <path d="M2 8l4-4 4 4-4 4L2 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M8 8l4-4 4 4-4 4L8 8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            BingX ↗
                          </a>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                {!hasAnalyzed ? (
                  <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm min-h-[440px] flex items-center justify-center">
                    <span className="text-sm text-gray-400 dark:text-gray-500">{t('selectAsset')}</span>
                  </div>
                ) : error ? (
                  <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm min-h-[440px] flex items-center justify-center">
                    <span className="text-sm text-red-500">{t('error')}: {error.message || t('error')}</span>
                  </div>
                ) : !data ? (
                  <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm min-h-[440px] flex items-center justify-center">
                    <span className="text-sm text-gray-400 dark:text-gray-500">{t('loading')}</span>
                  </div>
                ) : data.error ? (
                  <div className="bg-white dark:bg-[#1C1C1E] p-5 rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm min-h-[440px] flex items-center justify-center">
                    <span className="text-sm text-red-500">{t('error')}: {data.error}</span>
                  </div>
                ) : (
                  <SignalCard
                    symbol={params.symbol}
                    timeframe={params.timeframe}
                    marketId={params.marketId}
                    signal={data.signal}
                    pm={livePm || data.pm || { up: 0, down: 0, spread: 0, endDate: '' }}
                    price={data.price}
                    ind={data.ind}
                    atrPct={data.atrPct}
                    session={data.session}
                    volEmoji={data.volEmoji}
                    volComment={data.volComment}
                    atrValue={data.atrValue}
                  />
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl border border-gray-200 dark:border-[#2C2C2E] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-[#2C2C2E] flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                  {t('history')}
                </h2>
                {history.length > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    {selectedIds.size > 0 && (
                      <button
                        onClick={deleteSelected}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                          <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        Удалить выбранные ({selectedIds.size})
                      </button>
                    )}
                    <button
                      onClick={exportCSV}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#4C7F6E] hover:bg-[#3D6658] rounded-lg transition-all duration-200 shadow-sm hover:shadow"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                        <path d="M3 10l4 4 4-4M7 14V2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Экспорт CSV
                    </button>
                    <button
                      onClick={deleteAll}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                        <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Удалить все
                    </button>
                  </div>
                )}
              </div>

              {history.length > 0 && (
                <div className="px-5 py-3 border-b border-gray-100 dark:border-[#2C2C2E] flex flex-wrap items-center gap-2">
                  <div className="min-w-[120px]">
                    <CustomSelect
                      options={[
                        { value: '', label: 'Все активы' },
                        ...uniqueSymbols.map(s => ({ value: s, label: s })),
                      ]}
                      value={filterSymbol}
                      onChange={setFilterSymbol}
                      placeholder="Фильтр"
                    />
                  </div>
                  <div className="min-w-[100px]">
                    <CustomSelect
                      options={[
                        { value: '', label: 'Все TF' },
                        { value: '5min', label: '5m' },
                        { value: '15min', label: '15m' },
                      ]}
                      value={filterTimeframe}
                      onChange={setFilterTimeframe}
                      placeholder="TF"
                    />
                  </div>
                  <div className="min-w-[120px]">
                    <CustomSelect
                      options={[
                        { value: '', label: 'Все вердикты' },
                        { value: 'UP', label: '🟢 UP' },
                        { value: 'DOWN', label: '🔴 DOWN' },
                        { value: 'NEUTRAL', label: '⚪ NEUTRAL' },
                      ]}
                      value={filterVerdict}
                      onChange={setFilterVerdict}
                      placeholder="Вердикт"
                    />
                  </div>
                  <div className="min-w-[120px]">
                    <CustomSelect
                      options={[
                        { value: '', label: 'Все результаты' },
                        { value: 'UP', label: '🟢 UP' },
                        { value: 'DOWN', label: '🔴 DOWN' },
                        { value: 'waiting', label: '⏳ Ожидание' },
                      ]}
                      value={filterResult}
                      onChange={setFilterResult}
                      placeholder="Результат"
                    />
                  </div>
                </div>
              )}

              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-[#2C2C2E]">
                    <th className="px-2 py-2.5 w-8 text-center">
                      {filteredHistory.length > 0 && (
                        <Checkbox
                          checked={selectedIds.size === filteredHistory.length && filteredHistory.length > 0}
                          onChange={toggleSelectAll}
                        />
                      )}
                    </th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">№</th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('assetCol')}</th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('verdict')}</th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t('result')}</th>
                    <th className="px-2 py-2.5 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-5 py-8 text-center text-sm text-gray-400 dark:text-gray-600">
                        {history.length === 0 ? t('historyEmpty') : 'Ничего не найдено'}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((entry, i) => {
                      const endDate = entry.pm?.endDate;
                      const isExpired = endDate ? new Date(endDate).getTime() < Date.now() : false;
                      const actualResult = isExpired
                        ? (entry.pm.up > entry.pm.down ? 'UP' : entry.pm.down > entry.pm.up ? 'DOWN' : null)
                        : null;
                      const isCorrect = actualResult && entry.signal?.verdict
                        ? actualResult === entry.signal.verdict
                        : null;
                      const rowClass = entry.signal?.verdict === 'NEUTRAL' && actualResult
                        ? 'bg-yellow-50 dark:bg-yellow-900/10'
                        : isCorrect === true
                        ? 'bg-green-50 dark:bg-green-900/10'
                        : isCorrect === false
                        ? 'bg-red-50 dark:bg-red-900/10'
                        : '';
                      return (
                        <tr key={entry.id} className={`border-b border-gray-100 dark:border-[#2C2C2E] ${rowClass}`}>
                          <td className="px-2 py-2.5 text-center">
                            <Checkbox
                              checked={selectedIds.has(entry.id)}
                              onChange={() => toggleSelect(entry.id)}
                            />
                          </td>
                          <td className="px-2 py-2.5 text-center text-xs text-gray-500 dark:text-gray-400 font-mono">{filteredHistory.length - i}</td>
                          <td className="px-2 py-2.5 text-center text-[11px] text-gray-400 dark:text-gray-500 font-mono truncate max-w-[80px]">{entry.marketId}</td>
                          <td className="px-2 py-2.5 text-center text-sm text-gray-900 dark:text-white">{entry.symbol}/{entry.timeframe}</td>
                          <td className="px-2 py-2.5 text-center">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded ${
                              entry.signal?.verdict === 'UP'
                                ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
                                : entry.signal?.verdict === 'DOWN'
                                ? 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
                                : 'text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20'
                            }`}>
                              {entry.signal?.emoji} {entry.signal?.verdict || '—'}
                            </span>
                          </td>
                          <td className="px-2 py-2.5 text-center">
                            {actualResult === null ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded">
                                ⏳ Ожидание
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded ${
                                isCorrect
                                  ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/20'
                                  : 'text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/20'
                              }`}>
                                {actualResult}
                              </span>
                            )}
                          </td>
                          <td className="px-2 py-2.5 text-center whitespace-nowrap">
                            {entry.polymarketUrl && (
                              <a
                                href={entry.polymarketUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-1 mr-1 text-xs font-medium text-white bg-[#4C7F6E] hover:bg-[#3D6658] rounded transition-colors"
                                title="Открыть рынок"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 16 16" fill="none">
                                  <path d="M10 3h3v3M13 3L7 9M6 4H4a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </a>
                            )}
                            <button
                              onClick={() => deleteAnalysis(entry.id)}
                              className="inline-flex items-center px-2 py-1 text-xs text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors"
                              title="Удалить"
                            >
                              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none">
                                <path d="M3 4h10M6 4V3a1 1 0 011-1h2a1 1 0 011 1v1M5 4v9a1 1 0 001 1h4a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              {history.length > 0 && (
                <div className="px-5 py-2 border-t border-gray-100 dark:border-[#2C2C2E] text-[11px] text-gray-400 dark:text-gray-600 flex items-center justify-between">
                  <span>{t('historyDeleteHint')}</span>
                  {filteredHistory.length < history.length && (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                      Показано {filteredHistory.length} из {history.length}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
