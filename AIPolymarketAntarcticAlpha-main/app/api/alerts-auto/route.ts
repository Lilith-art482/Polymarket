import { NextResponse } from 'next/server';
import { calcIndicators, evaluateSignal, OHLCV } from '@/lib/indicators';
import { fetchOHLCV } from '@/lib/mexc';

const ASSETS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE'];
const TIMEFRAME = '5min';
const MIN_AGREEMENT = 5;

interface Market {
  id: string;
  title: string;
  url: string;
  endDate: string;
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
    value: number | string;
    verdict: 'UP' | 'DOWN' | 'NEUTRAL';
  }[];
  agreementCount: number;
  price: number;
  changePercent: number;
  signalDetails: string[];
}

async function fetchMarkets(symbol: string): Promise<Market[]> {
  try {
    const response = await globalThis.fetch(
      `https://gamma-api.polymarket.com/events?active=true&limit=100`
    );
    const data = await response.json();
    
    return (data || [])
      .filter((ev: any) => {
        const title = (ev.title || '').toLowerCase();
        const question = (ev.question || '').toLowerCase();
        return title.includes(symbol.toLowerCase()) || question.includes(symbol.toLowerCase());
      })
      .slice(0, 10)
      .map((ev: any) => {
        const market = ev.markets?.[0] || {};
        return {
          id: market.id || ev.id || '',
          title: market.title || ev.title || '',
          url: `https://polymarket.com/ru/event/${ev.slug || ev.id}`,
          endDate: market.endDate || ev.endDate || new Date().toISOString(),
        };
      });
  } catch (error) {
    console.error(`Failed to fetch markets for ${symbol}:`, error);
    return [];
  }
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

async function analyzeAsset(symbol: string): Promise<AlertData[]> {
  try {
    // Получаем OHLCV данные с MEXC
    const ohlcv = await fetchOHLCV(symbol, TIMEFRAME, 100);
    
    if (ohlcv.length < 30) {
      console.log(`Not enough OHLCV data for ${symbol}`);
      return [];
    }

    // Рассчитываем индикаторы
    const indResult = calcIndicators(ohlcv);
    const ind = indResult.current;
    
    // Получаем сигнал
    const signal = evaluateSignal(ind);
    
    // Получаем цену и изменение
    const priceData = await fetchPrice(symbol);
    
    // Получаем рынки Polymarket
    const markets = await fetchMarkets(symbol);
    
    const alerts: AlertData[] = [];
    
    for (const market of markets) {
      const endDate = new Date(market.endDate).getTime();
      const now = Date.now();
      const timeUntilEnd = endDate - now;
      
      // Проверяем за 45 секунд до окончания или меньше часа
      const isCriticalTime = timeUntilEnd > 0 && timeUntilEnd <= 45000;
      
      if (isCriticalTime || timeUntilEnd < 3600000) {
        // Проверяем порог соглашения (5+ индикаторов)
        if (signal.positiveCount >= MIN_AGREEMENT) {
          alerts.push({
            id: `${symbol}-${market.id}-${Date.now()}`,
            timestamp: now,
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
          });
        }
      }
    }
    
    return alerts;
  } catch (error) {
    console.error(`Error analyzing ${symbol}:`, error);
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get('symbol') || 'ALL';
  
  const alerts: AlertData[] = [];
  
  const assetsToCheck = symbol === 'ALL' ? ASSETS : [symbol];
  
  // Параллельный анализ всех активов
  const results = await Promise.all(
    assetsToCheck.map(asset => analyzeAsset(asset))
  );
  
  results.flat().forEach(alert => alerts.push(alert));
  
  // Сортируем по времени (новые сначала)
  alerts.sort((a, b) => b.timestamp - a.timestamp);
  
  return NextResponse.json({
    success: true,
    data: alerts,
    count: alerts.length,
    timestamp: Date.now(),
  });
}
