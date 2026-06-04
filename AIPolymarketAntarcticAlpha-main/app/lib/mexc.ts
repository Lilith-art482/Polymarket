import { OHLCV } from './indicators';

const MEXC_BASE = 'https://api.mexc.com';

const TIMEFRAME_MAP: Record<string, string> = {
  '1min': '1m',
  '5min': '5m',
  '15min': '15m',
  '30min': '30m',
  '1h': '1h',
  '4h': '4h',
  '1d': '1d',
};

export async function fetchOHLCV(symbol: string, timeframe: string, limit = 100): Promise<OHLCV[]> {
  const interval = TIMEFRAME_MAP[timeframe] || '15m';
  const url = `${MEXC_BASE}/api/v3/klines?symbol=${symbol}USDT&interval=${interval}&limit=${limit}`;

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`MEXC API error: ${res.status}`);
  }

  const json = await res.json();

  if (!Array.isArray(json)) {
    throw new Error('MEXC API: unexpected response format');
  }

  return json.map((item: string[]) => ({
    time: parseInt(item[0]),
    open: parseFloat(item[1]),
    high: parseFloat(item[2]),
    low: parseFloat(item[3]),
    close: parseFloat(item[4]),
    volume: parseFloat(item[5]),
  }));
}

export function getSessionInfo(): { name: string; emoji: string; sessionTime: string; totalMinutes: number; currentMin: string } {
  const now = new Date();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const totalElapsed = utcHours * 60 + utcMinutes;

  let sessionName: string;
  let sessionEmoji: string;
  let sessionStart: number;
  let sessionEnd: number;

  if (utcHours < 8) {
    sessionName = 'ASIA';
    sessionEmoji = '🌏';
    sessionStart = 0;
    sessionEnd = 480;
  } else if (utcHours < 16) {
    sessionName = 'LONDON';
    sessionEmoji = '🇪🇺';
    sessionStart = 480;
    sessionEnd = 960;
  } else if (utcHours < 20) {
    sessionName = 'OVERLAP';
    sessionEmoji = '🟢';
    sessionStart = 960;
    sessionEnd = 1200;
  } else {
    sessionName = 'NY';
    sessionEmoji = '🇺🇸';
    sessionStart = 1200;
    sessionEnd = 1440;
  }

  const elapsedInSession = totalElapsed - sessionStart;
  const totalMinutes = sessionEnd - sessionStart;
  const currentMin = Math.min(elapsedInSession + 1, totalMinutes);
  const sessionTime = Math.min(elapsedInSession, totalMinutes).toFixed(1);

  return { name: sessionName, emoji: sessionEmoji, sessionTime, totalMinutes, currentMin: currentMin.toString() };
}
