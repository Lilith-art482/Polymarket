export interface SignalFormatParams {
  marketId: string;
  verdict: string;
  emoji: string;
  entryPrice: number;
  currentPrice: number;
  change: string;
  symbol: string;
  price: number;
  strikeStatus: string;
  upPrice: number;
  downPrice: number;
  spread: number;
  sessionTime: string;
  totalMinutes: number;
  currentMin: string;
  sessionName: string;
  sessionEmoji: string;
  positiveCount: number;
  rsiLine: string;
  macdLine: string;
  vwapLine: string;
  emaLine: string;
  pivotsLine: string;
  bbLine: string;
  adxLine: string;
  obvLine: string;
  volEmoji: string;
  atrValue: string;
  volComment: string;
  polymarketUrl: string;
}

export function generateSignalText(p: SignalFormatParams): string {
  const lines: string[] = [];

  const hasPolymarket = p.upPrice > 0 || p.downPrice > 0;

  if (p.marketId) {
    lines.push(`📌 #${p.marketId} · ${p.verdict} · ${p.emoji}`);
  } else {
    lines.push(`📌 ${p.symbol} · ${p.verdict} · ${p.emoji}`);
  }

  if (hasPolymarket && p.entryPrice) {
    lines.push(`⏱ ТВХ ${p.entryPrice}¢ → ${p.currentPrice}¢ · Δ ${p.change}%`);
  }

  const sessionTotal = p.totalMinutes || 480;
  lines.push(`⏱ Минута на входе — ${p.sessionTime}/${sessionTotal}`);
  lines.push(`💰 ${p.symbol} — $${p.price.toFixed(2)} (${p.strikeStatus})`);

  if (hasPolymarket) {
    lines.push(`🎯 UP ${p.upPrice}¢ · DOWN ${p.downPrice}¢ · спред ${p.spread}¢`);
    lines.push(`📅 Минута ${p.currentMin} / ${sessionTotal} — окно входа`);
  }

  lines.push(`${p.sessionEmoji} Сессия — ${p.sessionName}`);
  lines.push(`📈 Индикаторы — ${p.positiveCount}/8 в сторону ${p.verdict}`);
  lines.push(p.rsiLine);
  lines.push(p.macdLine);
  lines.push(p.vwapLine);
  lines.push(p.emaLine);
  lines.push(p.pivotsLine);
  lines.push(p.bbLine);
  lines.push(p.adxLine);
  lines.push(p.obvLine);
  lines.push(`${p.volEmoji} Волатильность (ATR) — $${p.atrValue}`);
  lines.push(p.volComment);
  lines.push(`🎯 Вердикт — ${p.emoji} ${p.verdict} (${p.positiveCount}/8)`);

  if (p.polymarketUrl) {
    lines.push(`🔗 Рынок — ${p.polymarketUrl}`);
  } else {
    lines.push(`🔗 MEXC — https://www.mexc.com/ru-RU/exchange/${p.symbol}_USDT`);
  }

  return lines.join('\n');
}
