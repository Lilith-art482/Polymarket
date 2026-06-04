import { NextResponse } from 'next/server';
import { calcIndicators, evaluateSignal } from '@/lib/indicators';
import { fetchOHLCV } from '@/lib/mexc';

const ASSETS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE'];
const TIMEFRAME = '5min';
const MIN_AGREEMENT = 4;

interface Market {
  id: string;
  title: string;
  url: string;
  slug: string;
}

interface AlertData {
  id: string;
  timestamp: number;
  symbol: string;
  timeframe: string;
  marketId: string;
  marketTitle: string;
  marketUrl: string;
  verdict: 'UP' | 'DOWN' | 'NEUTRAL';
  confidence: number;
  indicators: {
    name: string;
    value: string;
    verdict: 'UP' | 'DOWN' | 'NEUTRAL';
  }[];
  agreementCount: number;
  price: number;
  changePercent: number;
  signalDetails: string[];
}

function floorTime(ts: number, step: number): number {
  return ts - (ts % step);
}

async function fetchMarkets(symbol: string): Promise<Market[]> {
  const INTERVALS: Record<string, { step: number; label: string }> = {
    '5min': { step: 300, label: '5m' },
  };
  
  const intv = INTERVALS[TIMEFRAME];
  const now = Math.floor(Date.now() / 1000);
  const baseStart = floorTime(now, intv.step);
  const sym = symbol.toLowerCase();
  const results: Market[] = [];
  const seen = new Set<string>();

  // Try current window + next 2 windows
  for (let i = 0; i < 3; i++) {
    const windowStart = baseStart + i * intv.step;
    const slug = `${sym}-updown-${intv.label}-${windowStart}`;

    try {
      const r = await fetch(
        `https://gamma-api.polymarket.com/events?slug=${encodeURIComponent(slug)}`,
        {
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolymarketApp/1.0)' },
        }
      );
      if (!r.ok) continue;
      const data = await r.json();
      const list = Array.isArray(data) ? data : [];
      if (list.length === 0) continue;

      const ev = list[0];
      const eventSlug = ev.slug || slug;
      const url = `https://polymarket.com/ru/event/${eventSlug}`;

      for (const m of ev.markets || []) {
        const id = String(m.id || '');
        if (!id || seen.has(id)) continue;
        seen.add(id);
        results.push({
          id,
          title: m.title || m.question || ev.title || '',
          slug: m.slug || eventSlug,
          url,
        });
        if (results.length >= 5) break;
      }
      if (results.length > 0) break;
    } catch (error) {
      console.error(`Error fetching markets for ${slug}:`, error);
    }
  }

  return results;
}

async function fetchPrice(symbol: string): Promise<{ price: number; changePercent: number }> {
  try {
    const response = await globalThis.fetch(
      `https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}USDT`
    );
    const data = await response.json();
    
    const price = parseFloat(data.lastPrice || '0');
    const changePercent = parseFloat(data.priceChangePercent || '0');
    
    return { price, changePercent };
  } catch (error) {
    console.error(`Failed to fetch price for ${symbol}:`, error);
    return { price: 0, changePercent: 0 };
  }
}

async function analyzeAsset(symbol: string): Promise<AlertData | null> {
  try {
    // Получаем OHLCV данные с MEXC
    const ohlcv = await fetchOHLCV(symbol, TIMEFRAME, 100);
    
    if (ohlcv.length < 30) {
      console.log(`Not enough OHLCV data for ${symbol}`);
      return null;
    }

    // Рассчитываем индикаторы
    const indResult = calcIndicators(ohlcv);
    const ind = indResult.current;
    
    // Получаем сигнал
    const signal = evaluateSignal(ind);
    
    // Получаем цену и изменение
    const priceData = await fetchPrice(symbol);
    
    // Получаем рынки Polymarket (как в Direct Query)
    const markets = await fetchMarkets(symbol);
    
    // Проверяем порог соглашения (4+ индикатора)
    if (signal.positiveCount >= MIN_AGREEMENT && markets.length > 0) {
      const market = markets[0]; // Берем первый рынок для каждого актива
      return {
        id: `${symbol}-${market.id}-${Date.now()}`,
        timestamp: Date.now(),
        symbol,
        timeframe: TIMEFRAME,
        marketId: market.id,
        marketTitle: market.title,
        marketUrl: market.url,
        verdict: signal.verdict as 'UP' | 'DOWN' | 'NEUTRAL',
        confidence: (signal.positiveCount / 8) * 100,
        indicators: [
          { name: 'RSI', value: ind.rsi.toFixed(1), verdict: ind.rsi < 35 ? 'UP' : ind.rsi > 65 ? 'DOWN' : 'NEUTRAL' as 'UP' | 'DOWN' | 'NEUTRAL' },
          { name: 'MACD', value: ind.macdHist.toFixed(4), verdict: ind.macdHist > 0 ? 'UP' : ind.macdHist < 0 ? 'DOWN' : 'NEUTRAL' as 'UP' | 'DOWN' | 'NEUTRAL' },
          { name: 'EMA9', value: ind.ema9.toFixed(2), verdict: ind.ema9 > ind.ema21 ? 'UP' : 'DOWN' as 'UP' | 'DOWN' },
          { name: 'EMA21', value: ind.ema21.toFixed(2), verdict: ind.ema9 > ind.ema21 ? 'UP' : 'DOWN' as 'UP' | 'DOWN' },
          { name: 'VWAP', value: ind.vwap.toFixed(2), verdict: ind.price > ind.vwap ? 'UP' : 'DOWN' as 'UP' | 'DOWN' },
          { name: 'BB %B', value: ind.bbPercentB.toFixed(2), verdict: ind.bbPercentB < 0.2 ? 'UP' : ind.bbPercentB > 0.8 ? 'DOWN' : 'NEUTRAL' as 'UP' | 'DOWN' | 'NEUTRAL' },
          { name: 'ADX', value: ind.adx.toFixed(0), verdict: ind.adx > 20 && ind.plusDI > ind.minusDI ? 'UP' : ind.adx > 20 && ind.minusDI > ind.plusDI ? 'DOWN' : 'NEUTRAL' as 'UP' | 'DOWN' | 'NEUTRAL' },
          { name: 'OBV', value: ind.obvSlope.toFixed(0), verdict: ind.obvSlope > 0 ? 'UP' : ind.obvSlope < 0 ? 'DOWN' : 'NEUTRAL' as 'UP' | 'DOWN' | 'NEUTRAL' },
        ],
        agreementCount: signal.positiveCount,
        price: priceData.price,
        changePercent: priceData.changePercent,
        signalDetails: Object.values(signal.details),
      };
    }
    
    return null;
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'ALL';
  
  const assetsToCheck = symbol === 'ALL' ? ASSETS : [symbol];
  
  // Параллельный анализ всех активов - по одному алерту на актив
  const results = await Promise.all(
    assetsToCheck.map(asset => analyzeAsset(asset))
  );
  
  const alerts = results.filter((a): a is AlertData => a !== null);
  
  // Сортируем по времени (новые сначала)
  alerts.sort((a, b) => b.timestamp - a.timestamp);
  
  return NextResponse.json({
    success: true,
    data: alerts,
    count: alerts.length,
    timestamp: Date.now(),
  });
}
