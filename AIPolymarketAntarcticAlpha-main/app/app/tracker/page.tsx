'use client';

import { useState, useEffect, useCallback } from 'react';
import { useT } from '@/lib/useT';

interface ActivityItem {
  type: string;
  market: string;
  outcome: string;
  size: string;
  price: string;
  fee: string;
  revenue: string;
  liquidity: string;
  timestamp: number;
  transactionHash: string;
  side?: string;
  usdcSize?: number;
}

interface PositionItem {
  asset: string;
  conditionId: string;
  title: string;
  outcome: string;
  oppositeOutcome: string;
  size: number;
  avgPrice: number;
  initialValue: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  curPrice: number;
  endDate: string;
}

const tsToDate = (ts: number | null | undefined): Date | null =>
  ts ? new Date(ts * 1000) : null;

const fmtTime = (ts: number | null | undefined): string =>
  ts ? tsToDate(ts)!.toLocaleString() : '—';

interface WalletActivity {
  wallet: string;
  count: number;
  data: ActivityItem[];
}

interface TrackedWallet {
  address: string;
  name: string;
  group: string;
  hidden: boolean;
  notifications: boolean;
  value: number;
  lastActivity: number | null;
  addedAt: number;
}

const STORAGE_KEY = 'tracked_wallets';
const DEFAULT_GROUPS = ['Default', 'Whales', 'Bots', 'Test'];

function loadWallets(): TrackedWallet[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveWallets(wallets: TrackedWallet[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch {}
}

function shortAddr(addr: string): string {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function timeAgo(ts: number | null | undefined): string | null {
  const d = tsToDate(ts);
  if (!d) return null;
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function statusInfo(ts: number | null | undefined): { label: string; color: string } {
  const d = tsToDate(ts);
  if (!d) return { label: 'Unknown', color: 'bg-gray-400' };
  const diff = Date.now() - d.getTime();
  if (diff < 5 * 60000) return { label: 'Online', color: 'bg-green-500' };
  if (diff < 60 * 60000) return { label: 'Recent', color: 'bg-yellow-500' };
  return { label: timeAgo(ts) || 'Away', color: 'bg-gray-400' };
}

const GROUPS_STORAGE_KEY = 'tracker_groups';

function loadGroups(): string[] {
  if (typeof window === 'undefined') return DEFAULT_GROUPS;
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : DEFAULT_GROUPS;
  } catch { return DEFAULT_GROUPS; }
}

function saveGroups(groups: string[]) {
  try { localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(groups)); } catch {}
}

export default function TrackerPage() {
  const { t } = useT();
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState<WalletActivity | null>(null);
  const [positions, setPositions] = useState<PositionItem[]>([]);

  const [tracked, setTracked] = useState<TrackedWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editGroup, setEditGroup] = useState('');

  const [groups, setGroups] = useState<string[]>(DEFAULT_GROUPS);
  const [newGroupInput, setNewGroupInput] = useState('');
  const [showGroupInput, setShowGroupInput] = useState(false);

  useEffect(() => { setTracked(loadWallets()); }, []);
  useEffect(() => { setGroups(loadGroups()); }, []);

  useEffect(() => { saveWallets(tracked); }, [tracked]);
  useEffect(() => { saveGroups(groups); }, [groups]);

  const typeTooltip: Record<string, string> = {
    TRADE: 'Покупка или продажа контрактов на рынке через стакан ордеров',
    BUY: 'Куплены контракты — ставка на то, что исход произойдёт',
    SELL: 'Проданы контракты — выход из позиции или ставка против исхода',
    REDEEM: 'Погашение контрактов после разрешения рынка — вывод выигрыша',
    SPLIT: 'Разделение USDC на пару Yes+No токенов — открытие позиции',
    MERGE: 'Слияние Yes+No обратно в USDC — закрытие позиции досрочно',
    REWARD: 'Награда или бонус (реферальный, промо, за активность)',
    CONVERSION: 'Внутренняя конвертация между прокси и основным кошельком',
  };

  const calcPortfolioValue = (data: ActivityItem[]): number => {
    if (!Array.isArray(data)) return 0;
    return data
      .filter(a => a.type?.toLowerCase() === 'buy')
      .reduce((s, a) => s + (parseFloat(a.size) * parseFloat(a.price || '0') || 0), 0);
  };

  const handleSearch = useCallback(async (addr?: string) => {
    const target = addr || wallet.trim();
    if (!target) return;
    setLoading(true);
    setError('');
    setPositions([]);

    try {
      // Один запрос с большим лимитом для получения всех данных
      const res = await fetch(`/api/polymarket/activity?wallet=${target}&limit=50000`);
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || err.message || `Request failed: ${res.status}`);
      }
      
      const result = await res.json();
      let allActivities = result.data || [];
      
      // Сортируем по времени (от новых к старым)
      allActivities = allActivities.sort((a: any, b: any) => b.timestamp - a.timestamp);
      
      const activityResult = {
        wallet: target,
        count: allActivities.length,
        data: allActivities,
      };
      
      setActivity(activityResult);
      setSelectedWallet(target);

      const posRes = await fetch(`/api/polymarket/positions?wallet=${target}&limit=100`);
      if (posRes.ok) {
        const posData = await posRes.json();
        setPositions(Array.isArray(posData.data) ? posData.data : []);
      } else {
        setPositions([]);
      }

      const lastTs = allActivities.length > 0 ? allActivities[0].timestamp : null;

      setTracked(prev => {
        const exists = prev.find(w => w.address.toLowerCase() === target.toLowerCase());
        if (exists) {
          return prev.map(w =>
            w.address.toLowerCase() === target.toLowerCase()
              ? { ...w, value: calcPortfolioValue(allActivities), lastActivity: lastTs || w.lastActivity }
              : w
          );
        }
        return prev;
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [wallet]);

  const addToTracked = () => {
    if (!activity || !activity.wallet) return;
    const addr = activity.wallet.toLowerCase();
    if (tracked.some(w => w.address.toLowerCase() === addr)) return;

    const lastTs = activity.data?.[0]?.timestamp || null;
    const val = calcPortfolioValue(activity.data);

    const newWallet: TrackedWallet = {
      address: activity.wallet,
      name: '',
      group: 'Default',
      hidden: false,
      notifications: true,
      value: val,
      lastActivity: lastTs,
      addedAt: Date.now(),
    };
    setTracked(prev => [...prev, newWallet]);
  };

  const removeFromTracked = (addr: string) => {
    setTracked(prev => prev.filter(w => w.address.toLowerCase() !== addr.toLowerCase()));
    if (selectedWallet?.toLowerCase() === addr.toLowerCase()) {
      setSelectedWallet(null);
    }
  };

  const toggleHidden = (addr: string) => {
    setTracked(prev => prev.map(w =>
      w.address.toLowerCase() === addr.toLowerCase() ? { ...w, hidden: !w.hidden } : w
    ));
  };

  const toggleNotifications = (addr: string) => {
    setTracked(prev => prev.map(w =>
      w.address.toLowerCase() === addr.toLowerCase() ? { ...w, notifications: !w.notifications } : w
    ));
  };

  const startEdit = (w: TrackedWallet) => {
    setEditingWallet(w.address);
    setEditName(w.name);
    setEditGroup(w.group);
  };

  const saveEdit = () => {
    if (!editingWallet) return;
    setTracked(prev => prev.map(w =>
      w.address.toLowerCase() === editingWallet.toLowerCase()
        ? { ...w, name: editName, group: editGroup }
        : w
    ));
    setEditingWallet(null);
  };

  const copyAddress = async (addr: string) => {
    try {
      await navigator.clipboard.writeText(addr);
    } catch {}
  };

  const addGroup = () => {
    const g = newGroupInput.trim();
    if (g && !groups.includes(g)) {
      setGroups(prev => [...prev, g]);
    }
    setNewGroupInput('');
    setShowGroupInput(false);
  };

  const selectWallet = (addr: string) => {
    setSelectedWallet(addr);
    setWallet(addr);
    handleSearch(addr);
  };

  const visibleWallets = tracked.filter(w => !w.hidden);

  const groupColors: Record<string, string> = {
    Default: 'bg-blue-500',
    Whales: 'bg-purple-500',
    Bots: 'bg-orange-500',
    Test: 'bg-gray-500',
  };

  const getGroupColor = (g: string) => groupColors[g] || 'bg-teal-500';

  const grouped = groups.map(g => ({
    group: g,
    wallets: visibleWallets.filter(w => w.group === g),
  })).filter(gg => gg.wallets.length > 0);

  const ungrouped = visibleWallets.filter(w => !groups.includes(w.group));
  if (ungrouped.length > 0) grouped.push({ group: 'Other', wallets: ungrouped });

  const archiveWallets = tracked.filter(w => w.hidden);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-[#121212]">
      {sidebarOpen && (
        <aside className="w-72 lg:w-80 shrink-0 border-r border-gray-200/70 dark:border-[#2C2C2E]/70 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl flex flex-col">
          <div className="px-4 py-4 border-b border-gray-200/70 dark:border-[#2C2C2E]/70 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">My Wallets</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{tracked.length}</span>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors lg:hidden">
                <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4">
            {tracked.length === 0 && (
              <div className="text-center py-8">
                <svg className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-xs text-gray-400 dark:text-gray-500">No wallets tracked yet</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Search a wallet and add it</p>
              </div>
            )}

            {grouped.map(gg => (
              <div key={gg.group}>
                <div className="flex items-center gap-1.5 px-1 mb-1.5">
                  <span className={`w-2 h-2 rounded-full ${getGroupColor(gg.group)}`} />
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{gg.group}</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto font-mono">{gg.wallets.length}</span>
                </div>
                <div className="space-y-1">
                  {gg.wallets.map(w => {
                    const status = statusInfo(w.lastActivity);
                    const isSelected = selectedWallet?.toLowerCase() === w.address.toLowerCase();
                    const isEditing = editingWallet === w.address;

                    return (
                      <div
                        key={w.address}
                        onClick={() => selectWallet(w.address)}
                        className={`group relative rounded-xl p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#4C7F6E]/10 ring-1 ring-[#4C7F6E]/30'
                            : 'hover:bg-gray-100 dark:hover:bg-[#2C2C2E]/50'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2" onClick={e => e.stopPropagation()}>
                            <input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              placeholder="Wallet name"
                              className="w-full px-2 py-1 text-xs rounded-lg border border-gray-300/80 dark:border-[#2C2C2E] bg-gray-50/80 dark:bg-[#121212]/80 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-[#4C7F6E]"
                              autoFocus
                            />
                            <div className="flex gap-1 flex-wrap">
                              {groups.map(g => (
                                <button
                                  key={g}
                                  onClick={() => setEditGroup(g)}
                                  className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-colors ${
                                    editGroup === g
                                      ? 'bg-[#4C7F6E] text-white'
                                      : 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3C3C3E]'
                                  }`}
                                >
                                  {g}
                                </button>
                              ))}
                              <button
                                onClick={() => setShowGroupInput(true)}
                                className="px-2 py-0.5 text-[10px] rounded-md font-medium bg-gray-100 dark:bg-[#2C2C2E] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              >
                                +New
                              </button>
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <button onClick={saveEdit} className="px-3 py-1 text-[10px] font-medium rounded-lg bg-[#4C7F6E] text-white hover:bg-[#3D6658] transition-colors">
                                Save
                              </button>
                              <button onClick={() => setEditingWallet(null)} className="px-3 py-1 text-[10px] font-medium rounded-lg bg-gray-100 dark:bg-[#2C2C2E] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.color}`} title={status.label} />
                                <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                  {w.name || shortAddr(w.address)}
                                </span>
                              </div>
                              <span className="text-xs font-mono text-gray-900 dark:text-white shrink-0 ml-2">
                                {w.value.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
                                {shortAddr(w.address)}
                              </span>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={e => { e.stopPropagation(); copyAddress(w.address); }}
                                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors"
                                  title="Copy address"
                                >
                                  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                  </svg>
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); toggleHidden(w.address); }}
                                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors"
                                  title={w.hidden ? 'Show' : 'Hide'}
                                >
                                  {w.hidden ? (
                                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                                      <line x1="1" y1="1" x2="23" y2="23" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); toggleNotifications(w.address); }}
                                  className={`p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors ${w.notifications ? '' : 'opacity-40'}`}
                                  title={w.notifications ? 'Mute notifications' : 'Enable notifications'}
                                >
                                  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                                  </svg>
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); startEdit(w); }}
                                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {archiveWallets.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 px-1 mb-1.5 pt-3 border-t border-gray-200/70 dark:border-[#2C2C2E]/70">
                  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="21 8 21 21 3 21 3 8" /><rect x="1" y="3" width="22" height="5" /><line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Archive</span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto font-mono">{archiveWallets.length}</span>
                </div>
                <div className="space-y-1">
                  {archiveWallets.map(w => {
                    const status = statusInfo(w.lastActivity);
                    const isSelected = selectedWallet?.toLowerCase() === w.address.toLowerCase();
                    const isEditing = editingWallet === w.address;

                    return (
                      <div
                        key={w.address}
                        onClick={() => selectWallet(w.address)}
                        className={`group relative rounded-xl p-3 cursor-pointer transition-all opacity-60 hover:opacity-100 ${
                          isSelected
                            ? 'bg-[#4C7F6E]/10 ring-1 ring-[#4C7F6E]/30'
                            : 'hover:bg-gray-100 dark:hover:bg-[#2C2C2E]/50'
                        }`}
                      >
                        {isEditing ? (
                          <div className="space-y-2" onClick={e => e.stopPropagation()}>
                            <input
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              placeholder="Wallet name"
                              className="w-full px-2 py-1 text-xs rounded-lg border border-gray-300/80 dark:border-[#2C2C2E] bg-gray-50/80 dark:bg-[#121212]/80 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-[#4C7F6E]"
                              autoFocus
                            />
                            <div className="flex gap-1 flex-wrap">
                              {groups.map(g => (
                                <button
                                  key={g}
                                  onClick={() => setEditGroup(g)}
                                  className={`px-2 py-0.5 text-[10px] rounded-md font-medium transition-colors ${
                                    editGroup === g
                                      ? 'bg-[#4C7F6E] text-white'
                                      : 'bg-gray-100 dark:bg-[#2C2C2E] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3C3C3E]'
                                  }`}
                                >
                                  {g}
                                </button>
                              ))}
                            </div>
                            <div className="flex gap-1.5 pt-1">
                              <button onClick={saveEdit} className="px-3 py-1 text-[10px] font-medium rounded-lg bg-[#4C7F6E] text-white hover:bg-[#3D6658] transition-colors">
                                Save
                              </button>
                              <button onClick={() => setEditingWallet(null)} className="px-3 py-1 text-[10px] font-medium rounded-lg bg-gray-100 dark:bg-[#2C2C2E] text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors">
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.color}`} title={status.label} />
                                <span className="text-xs font-medium text-gray-900 dark:text-white truncate">
                                  {w.name || shortAddr(w.address)}
                                </span>
                              </div>
                              <span className="text-xs font-mono text-gray-900 dark:text-white shrink-0 ml-2">
                                {w.value.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono truncate">
                                {shortAddr(w.address)}
                              </span>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={e => { e.stopPropagation(); copyAddress(w.address); }}
                                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors"
                                  title="Copy address"
                                >
                                  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                  </svg>
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); toggleHidden(w.address); }}
                                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors"
                                  title="Restore from archive"
                                >
                                  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); toggleNotifications(w.address); }}
                                  className={`p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors ${w.notifications ? '' : 'opacity-40'}`}
                                  title={w.notifications ? 'Mute notifications' : 'Enable notifications'}
                                >
                                  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" />
                                  </svg>
                                </button>
                                <button
                                  onClick={e => { e.stopPropagation(); startEdit(w); }}
                                  className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors"
                                  title="Edit"
                                >
                                  <svg className="w-3 h-3 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {showGroupInput && (
            <div className="border-t border-gray-200/70 dark:border-[#2C2C2E]/70 p-3">
              <div className="flex gap-1.5">
                <input
                  value={newGroupInput}
                  onChange={e => setNewGroupInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addGroup()}
                  placeholder="Group name"
                  className="flex-1 px-2 py-1 text-xs rounded-lg border border-gray-300/80 dark:border-[#2C2C2E] bg-gray-50/80 dark:bg-[#121212]/80 text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-[#4C7F6E]"
                  autoFocus
                />
                <button onClick={addGroup} className="px-2 py-1 text-xs font-medium rounded-lg bg-[#4C7F6E] text-white hover:bg-[#3D6658] transition-colors">
                  Add
                </button>
                <button onClick={() => { setShowGroupInput(false); setNewGroupInput(''); }} className="px-2 py-1 text-xs font-medium rounded-lg bg-gray-100 dark:bg-[#2C2C2E] text-gray-500 hover:bg-gray-200 dark:hover:bg-[#3C3C3E] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </aside>
      )}

      <div className="flex-1 min-w-0 p-4 md:p-8">
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="mb-4 p-2 rounded-xl bg-white/80 dark:bg-[#1C1C1E]/80 border border-gray-200/70 dark:border-[#2C2C2E]/70 shadow-sm hover:bg-gray-100 dark:hover:bg-[#2C2C2E] transition-colors"
            title="Open sidebar"
          >
            <svg className="w-4 h-4 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        )}

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4C7F6E]/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('nav.tracker')}</h1>
              <p className="text-xs text-gray-400 dark:text-gray-500">Polymarket wallet tracker</p>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-200/70 dark:border-[#2C2C2E]/70 shadow-sm p-5">
            <div className="flex gap-3">
              <input
                value={wallet}
                onChange={e => setWallet(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="0x... wallet address"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border border-gray-300/80 dark:border-[#2C2C2E] bg-gray-50/80 dark:bg-[#121212]/80 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#4C7F6E] transition-all placeholder-gray-400 dark:placeholder-gray-600 font-mono text-xs"
              />
              <button
                onClick={() => handleSearch()}
                disabled={loading || !wallet.trim()}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-[#4C7F6E] hover:bg-[#3D6658] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/15 rounded-xl border border-red-200/70 dark:border-red-800/50 p-4 text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          {activity && (
            <>
              {!tracked.some(w => w.address.toLowerCase() === activity.wallet.toLowerCase()) && (
                <div className="bg-[#4C7F6E]/5 dark:bg-[#4C7F6E]/5 rounded-xl border border-[#4C7F6E]/20 dark:border-[#4C7F6E]/20 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white font-medium">
                      {shortAddr(activity.wallet)}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Not in your tracked wallets</p>
                  </div>
                  <button
                    onClick={addToTracked}
                    className="px-4 py-2 text-xs font-medium rounded-xl bg-[#4C7F6E] text-white hover:bg-[#3D6658] transition-all"
                  >
                    + Add to tracking
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatCard label="Wallet" value={shortAddr(activity.wallet)} sub="Polymarket address" />
                <StatCard label="Total Transactions" value={`${activity.data.length}`} sub="All time" />
                <StatCard label="Active Positions" value={`${positions.length}`} sub={`${positions.reduce((s, p) => s + p.currentValue, 0).toFixed(2)} USDC total`} />
                <StatCard label="Realized P&L" value={`${positions.reduce((s, p) => s + p.cashPnl, 0) >= 0 ? '+' : ''}${positions.reduce((s, p) => s + p.cashPnl, 0).toFixed(2)} USDC`} accent={positions.reduce((s, p) => s + p.cashPnl, 0) >= 0 ? 'green' : 'red'} />
              </div>

              {positions.length > 0 && (
                <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-200/70 dark:border-[#2C2C2E]/70 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200/70 dark:border-[#2C2C2E]/70">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Active Positions ({positions.length})</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200/70 dark:border-[#2C2C2E]/70 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          <th className="text-left px-5 py-3 font-medium">Market</th>
                          <th className="text-left px-5 py-3 font-medium">Outcome</th>
                          <th className="text-right px-5 py-3 font-medium">Size</th>
                          <th className="text-right px-5 py-3 font-medium">Avg Price</th>
                          <th className="text-right px-5 py-3 font-medium">Current Price</th>
                          <th className="text-right px-5 py-3 font-medium">Value</th>
                          <th className="text-right px-5 py-3 font-medium">P&L</th>
                          <th className="text-right px-5 py-3 font-medium">P&L %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {positions.map((p, i) => {
                          const pnlPos = p.cashPnl >= 0;
                          return (
                            <tr key={p.conditionId || i} className="border-b border-gray-100/70 dark:border-[#2C2C2E]/40 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3 text-gray-900 dark:text-white max-w-[220px] truncate">{p.title || '—'}</td>
                              <td className="px-5 py-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                  p.outcome === 'Yes'
                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                }`}>{p.outcome}</span>
                              </td>
                              <td className="px-5 py-3 text-right font-mono text-gray-900 dark:text-white">{p.size.toFixed(2)}</td>
                              <td className="px-5 py-3 text-right font-mono text-gray-900 dark:text-white">{(p.avgPrice * 100).toFixed(2)}%</td>
                              <td className="px-5 py-3 text-right font-mono text-gray-900 dark:text-white">{(p.curPrice * 100).toFixed(2)}%</td>
                              <td className="px-5 py-3 text-right font-mono text-gray-900 dark:text-white">{p.currentValue.toFixed(2)}</td>
                              <td className={`px-5 py-3 text-right font-mono ${pnlPos ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {p.cashPnl >= 0 ? '+' : ''}{p.cashPnl.toFixed(2)}
                              </td>
                              <td className={`px-5 py-3 text-right font-mono ${pnlPos ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                {p.percentPnl >= 0 ? '+' : ''}{p.percentPnl.toFixed(2)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {positions.length === 0 && activity.data.length > 0 && (
                <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-200/70 dark:border-[#2C2C2E]/70 shadow-sm p-5 text-center">
                  <p className="text-xs text-gray-400 dark:text-gray-500">No active positions</p>
                </div>
              )}

              {activity.data.length > 0 && (
                <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-200/70 dark:border-[#2C2C2E]/70 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-200/70 dark:border-[#2C2C2E]/70">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Activity</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200/70 dark:border-[#2C2C2E]/70 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                          <th className="text-left px-5 py-3 font-medium">Type</th>
                          <th className="text-left px-5 py-3 font-medium">Market</th>
                          <th className="text-left px-5 py-3 font-medium">Outcome</th>
                          <th className="text-right px-5 py-3 font-medium">Size</th>
                          <th className="text-right px-5 py-3 font-medium">Price</th>
                          <th className="text-right px-5 py-3 font-medium">Value</th>
                          <th className="text-right px-5 py-3 font-medium">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activity.data.slice(0, 100).map((a, i) => {
                          const val = (parseFloat(a.size) || 0) * (parseFloat(a.price) || 0);
                          const isBuy = a.type?.toLowerCase() === 'buy';
                          return (
                            <tr key={a.transactionHash || i} className="border-b border-gray-100/70 dark:border-[#2C2C2E]/40 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                              <td className="px-5 py-3">
                                <div className="relative group/tooltip">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${
                                    isBuy
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                  }`}>
                                    {a.type || '—'}
                                  </span>
                                  <div className="absolute top-full left-0 mt-1.5 px-3 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-[11px] leading-relaxed opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none shadow-lg z-10 w-64 text-left">
                                    <div className="font-medium mb-0.5">{a.type}{a.side ? ` · ${a.side}` : ''}</div>
                                    <div className="text-white/80 dark:text-gray-900/80">
                                      {a.type === 'TRADE' && a.side
                                        ? typeTooltip[a.side] || typeTooltip.TRADE
                                        : typeTooltip[a.type] || a.type}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3 text-gray-900 dark:text-white max-w-[200px] truncate">{a.market || '—'}</td>
                              <td className="px-5 py-3 text-gray-600 dark:text-gray-400">{a.outcome || '—'}</td>
                              <td className="px-5 py-3 text-right font-mono text-gray-900 dark:text-white">{parseFloat(a.size || '0').toFixed(2)}</td>
                              <td className="px-5 py-3 text-right font-mono text-gray-900 dark:text-white">{a.price ? `${(parseFloat(a.price) * 100).toFixed(2)}%` : '—'}</td>
                              <td className="px-5 py-3 text-right font-mono text-gray-900 dark:text-white">{val.toFixed(2)}</td>
                              <td className="px-5 py-3 text-right text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                {fmtTime(a.timestamp)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {activity.data.length > 0 && (
                <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-200/70 dark:border-[#2C2C2E]/70 shadow-sm p-10 text-center">
                  <svg className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <p className="text-sm text-gray-400 dark:text-gray-500">No activity found for this wallet</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string | boolean }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-500 dark:text-red-400',
  };
  const valClass = typeof accent === 'string' ? colorMap[accent] || '' : '';
  return (
    <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-200/70 dark:border-[#2C2C2E]/70 shadow-sm p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-semibold font-mono ${valClass || 'text-gray-900 dark:text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</div>}
    </div>
  );
}
