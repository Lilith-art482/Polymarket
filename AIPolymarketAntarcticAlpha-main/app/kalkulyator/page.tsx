'use client';

import { useState } from 'react';
import { useT } from '@/lib/useT';

type CalcMode = 'polymarket' | 'risk';
type Category = 'геополитика' | 'спорт' | 'политика' | 'финансы' | 'техно' | 'экономика' | 'культура' | 'погода' | 'крипто' | 'custom';

const CATEGORIES: { key: Category; label: string; feeRate: number }[] = [
  { key: 'геополитика', label: 'Геополитика', feeRate: 0 },
  { key: 'спорт', label: 'Спорт', feeRate: 0.03 },
  { key: 'политика', label: 'Политика', feeRate: 0.04 },
  { key: 'финансы', label: 'Финансы', feeRate: 0.04 },
  { key: 'техно', label: 'Техно', feeRate: 0.04 },
  { key: 'крипто', label: 'Крипто', feeRate: 0.072 },
  { key: 'экономика', label: 'Экономика', feeRate: 0.05 },
  { key: 'культура', label: 'Культура', feeRate: 0.05 },
  { key: 'погода', label: 'Погода', feeRate: 0.05 },
  { key: 'custom', label: 'Своя комиссия', feeRate: 0 },
];

const tabs: { key: CalcMode; label: string }[] = [
  { key: 'polymarket', label: 'Polymarket' },
  { key: 'risk', label: 'Риск / Прибыль' },
];

export default function KalkulyatorPage() {
  const { t } = useT();
  const [mode, setMode] = useState<CalcMode>('polymarket');

  const [entryPrice, setEntryPrice] = useState('0.58');
  const [investment, setInvestment] = useState('100');
  const [category, setCategory] = useState<Category>('крипто');
  const [customFeeRate, setCustomFeeRate] = useState('0.05');

  const [rrEntry, setRrEntry] = useState('0.58');
  const [stopLoss, setStopLoss] = useState('0.50');
  const [takeProfit, setTakeProfit] = useState('0.90');
  const [riskAmount, setRiskAmount] = useState('50');

  const ep = parseFloat(entryPrice) || 0;
  const inv = parseFloat(investment) || 0;
  const feeRate = category === 'custom' ? (parseFloat(customFeeRate) || 0) : (CATEGORIES.find(c => c.key === category)?.feeRate ?? 0);
  const grossContracts = ep > 0 ? inv / ep : 0;
  const feeShares = grossContracts * feeRate * (1 - ep);
  const contracts = grossContracts - feeShares;
  const feeAmount = feeShares * ep;
  const payoutWin = contracts * 1.00;
  const profitWin = payoutWin - inv;
  const lossAmount = inv;
  const roiWin = inv > 0 ? (profitWin / inv) * 100 : 0;

  const rrE = parseFloat(rrEntry) || 0;
  const sl = parseFloat(stopLoss) || 0;
  const tp = parseFloat(takeProfit) || 0;
  const riskAmt = parseFloat(riskAmount) || 0;
  const riskPerShare = Math.abs(rrE - sl);
  const rewardPerShare = Math.abs(tp - rrE);
  const rrRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;
  const posSize = riskPerShare > 0 ? riskAmt / riskPerShare : 0;
  const potentialProfit = posSize * rewardPerShare;

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50 dark:bg-[#121212]">
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#4C7F6E]/10 flex items-center justify-center">
            <svg className="w-5 h-5 text-[#4C7F6E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t('nav.calculator')}</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Расчёт прибыли, риска и позиций</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl rounded-2xl border border-gray-200/70 dark:border-[#2C2C2E]/70 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200/70 dark:border-[#2C2C2E]/70">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                  mode === tab.key
                    ? 'text-[#4C7F6E] bg-[#4C7F6E]/5 border-b-2 border-[#4C7F6E]'
                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-5 space-y-4">
            {mode === 'polymarket' && (
              <>
                <Label>
                  Цена входа (USDC)
                  <Input type="number" step="0.01" min="0.01" max="0.99" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} />
                </Label>
                <Label>
                  Сумма инвестиции (USDC)
                  <Input type="number" step="10" min="1" value={investment} onChange={e => setInvestment(e.target.value)} />
                </Label>
                <Label>
                  Категория рынка
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    {CATEGORIES.slice(0, 6).map(c => (
                      <button
                        key={c.key}
                        onClick={() => setCategory(c.key)}
                        className={`px-2.5 py-2 text-xs font-medium rounded-lg transition-all ${
                          category === c.key
                            ? 'bg-[#4C7F6E] text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2C2C2E]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    {CATEGORIES.slice(6).map(c => (
                      <button
                        key={c.key}
                        onClick={() => setCategory(c.key)}
                        className={`px-2.5 py-2 text-xs font-medium rounded-lg transition-all ${
                          category === c.key
                            ? 'bg-[#4C7F6E] text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-[#1C1C1E] text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#2C2C2E]'
                        }`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </Label>

                {category === 'custom' && (
                  <Label>
                    FeeRate (0.01 = 1%)
                    <Input type="number" step="0.001" min="0" max="1" value={customFeeRate} onChange={e => setCustomFeeRate(e.target.value)} />
                  </Label>
                )}

                {ep > 0 && inv > 0 && (
                  <div className="bg-[#4C7F6E]/5 dark:bg-[#4C7F6E]/5 rounded-xl border border-[#4C7F6E]/20 dark:border-[#4C7F6E]/20 p-4 space-y-2">
                    <ResultRow label="Куплено контрактов" value={`${contracts.toFixed(2)}`} />
                    {feeRate > 0 && <ResultRow label={`Комиссия (${(feeRate * 100).toFixed(2)}% × цена)`} value={`-${feeAmount.toFixed(2)} USDC`} accent="red" />}

                    <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-2 mt-1" />

                    <div className="bg-green-50 dark:bg-green-900/15 rounded-lg p-3 space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
                        ✓ При выигрыше
                      </div>
                      <ResultRow label="Выплата" value={`${payoutWin.toFixed(2)} USDC`} />
                      <ResultRow
                        label="Прибыль"
                        value={`${profitWin >= 0 ? '+' : ''}${profitWin.toFixed(2)} USDC`}
                        accent={profitWin >= 0 ? 'green' : 'red'}
                        bold
                      />
                      <ResultRow
                        label="ROI"
                        value={`${roiWin >= 0 ? '+' : ''}${roiWin.toFixed(2)}%`}
                        accent={roiWin >= 0 ? 'green' : 'red'}
                        bold
                      />
                    </div>

                    <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-1" />

                    <div className="bg-red-50 dark:bg-red-900/15 rounded-lg p-3 space-y-1.5">
                      <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                        ✗ При проигрыше
                      </div>
                      <ResultRow
                        label="Убыток"
                        value={`-${lossAmount.toFixed(2)} USDC`}
                        accent="red"
                        bold
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            {mode === 'risk' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Label>
                    Цена входа (USDC)
                    <Input type="number" step="0.01" min="0.01" value={rrEntry} onChange={e => setRrEntry(e.target.value)} />
                  </Label>
                  <Label>
                    Риск на сделку (USDC)
                    <Input type="number" step="10" min="1" value={riskAmount} onChange={e => setRiskAmount(e.target.value)} />
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Label>
                    Stop Loss (USDC)
                    <Input type="number" step="0.01" min="0.01" value={stopLoss} onChange={e => setStopLoss(e.target.value)} />
                  </Label>
                  <Label>
                    Take Profit (USDC)
                    <Input type="number" step="0.01" min="0.01" value={takeProfit} onChange={e => setTakeProfit(e.target.value)} />
                  </Label>
                </div>

                {rrE > 0 && sl > 0 && tp > 0 && (
                  <ResultBox>
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        <span className="text-gray-500 dark:text-gray-400">{sl.toFixed(2)}</span>
                      </div>
                      <div className="text-gray-400 text-xs">→</div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-[#4C7F6E]" />
                        <span className="text-gray-900 dark:text-white font-semibold">{rrE.toFixed(2)}</span>
                      </div>
                      <div className="text-gray-400 text-xs">→</div>
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-2 h-2 rounded-full bg-green-400" />
                        <span className="text-gray-500 dark:text-gray-400">{tp.toFixed(2)}</span>
                      </div>
                    </div>
                    <ResultRow label="Риск на 1 контракт" value={`${riskPerShare.toFixed(4)} USDC`} />
                    <ResultRow label="Награда на 1 контракт" value={`${rewardPerShare.toFixed(4)} USDC`} />
                    <ResultRow
                      label="Соотношение R/R"
                      value={`1 : ${rrRatio.toFixed(2)}`}
                      accent={rrRatio >= 2 ? 'green' : rrRatio >= 1 ? undefined : 'red'}
                      bold
                    />
                    <div className="border-t border-gray-200/50 dark:border-gray-700/50 pt-2 mt-1" />
                    <ResultRow label="Размер позиции" value={`${posSize.toFixed(2)} контрактов`} bold />
                    <ResultRow
                      label="Потенциальная прибыль"
                      value={`+${potentialProfit.toFixed(2)} USDC`}
                      accent="green"
                      bold
                    />
                    <ResultRow
                      label="Потенциальный убыток"
                      value={`-${riskAmt.toFixed(2)} USDC`}
                      accent="red"
                    />
                  </ResultBox>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm text-gray-600 dark:text-gray-400 space-y-1.5">
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="block w-full px-3 py-2.5 rounded-lg text-sm border border-gray-300/80 dark:border-[#2C2C2E] bg-gray-50/80 dark:bg-[#121212]/80 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-[#4C7F6E] transition-all placeholder-gray-400 dark:placeholder-gray-600"
    />
  );
}

function ResultBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#4C7F6E]/5 dark:bg-[#4C7F6E]/5 rounded-xl border border-[#4C7F6E]/20 dark:border-[#4C7F6E]/20 p-4 space-y-2">
      {children}
    </div>
  );
}

function ResultRow({ label, value, accent, bold }: { label: string; value: string; accent?: string; bold?: boolean }) {
  const colorMap: Record<string, string> = {
    green: 'text-green-600 dark:text-green-400',
    red: 'text-red-500 dark:text-red-400',
  };
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className={`font-mono ${accent ? colorMap[accent] || '' : 'text-gray-900 dark:text-white'} ${bold ? 'font-semibold' : ''}`}>
        {value}
      </span>
    </div>
  );
}
