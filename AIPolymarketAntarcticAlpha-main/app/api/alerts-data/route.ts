import { NextRequest, NextResponse } from 'next/server';

const INTERVALS: Record<string, { step: number; label: string }> = {
  '5min': { step: 300, label: '5m' },
  '15min': { step: 900, label: '15m' },
};

const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE'];

function floorTime(ts: number, step: number): number {
  return ts - (ts % step);
}

// Получаем данные о рынке с ценой открытия/закрытия
async function fetchMarketData(symbol: string, timeframe: string, windowStart: number) {
  const interval = INTERVALS[timeframe];
  const slug = `${symbol.toLowerCase()}-updown-${interval.label}-${windowStart}`;

  try {
    const r = await fetch(
      `https://gamma-api.polymarket.com/events?slug=${encodeURIComponent(slug)}`,
      {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolymarketApp/1.0)' },
      }
    );
    if (!r.ok) return null;
    const data = await r.json();
    const list = Array.isArray(data) ? data : [];
    if (list.length === 0) return null;

    const ev = list[0];
    const markets = ev.markets || [];
    if (markets.length === 0) return null;

    // Берем первый рынок и получаем его детали с ценой
    const market = markets[0];
    const marketId = market.id || market.slug;
    
    // Получаем детали рынка с ценой
    const marketDetails = await fetchMarketDetails(marketId);
    
    return {
      market,
      marketDetails,
      windowStart,
      slug,
    };
  } catch (error) {
    console.error(`Error fetching market for ${symbol} ${timeframe}:`, error);
    return null;
  }
}

// Получаем детали рынка с ценой
async function fetchMarketDetails(marketId: string) {
  try {
    // Пробуем несколько API endpoints
    const endpoints = [
      `https://gamma-api.polymarket.com/markets/${marketId}`,
      `https://gamma-api.polymarket.com/markets?slug=${marketId}`,
      `https://data-api.polymarket.com/markets/${marketId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const r = await fetch(endpoint, {
          signal: AbortSignal.timeout(3000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolymarketApp/1.0)' },
        });
        if (r.ok) {
          const data = await r.json();
          const marketData = Array.isArray(data) ? data[0] : data;
          if (marketData) {
            return {
              id: marketData.id || marketId,
              question: marketData.question || marketData.title || '',
              slug: marketData.slug || marketId,
              outcomes: marketData.outcomes || [],
              prices: marketData.prices || [],
              bestOffers: marketData.bestOffers || {},
              endDate: marketData.endDate || null,
              closed: marketData.closed || false,
              volume: marketData.volume || 0,
            };
          }
        }
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.error('Error fetching market details:', error);
  }
  return null;
}

// Получаем историю рынков для символа
async function fetchSymbolHistory(symbol: string, timeframe: string, limit: number = 1000) {
  const interval = INTERVALS[timeframe];
  if (!interval) return [];

  const records: any[] = [];
  const now = Math.floor(Date.now() / 1000);
  
  // Идем назад во времени, собирая рынки
  // Начинаем с текущего окна и идем назад
  let checkedWindows = 0;
  const maxWindows = limit * 3; // Проверяем больше окон, так как не все могут существовать

  for (let i = maxWindows; i > 0 && records.length < limit; i--) {
    checkedWindows++;
    
    // Пропускаем будущие окна
    const windowStart = floorTime(now - i * interval.step, interval.step);
    if (windowStart > now) continue;

    if (checkedWindows % 100 === 0) {
      console.log(`Checked ${checkedWindows} windows, collected ${records.length} records for ${symbol} ${timeframe}`);
    }

    const data = await fetchMarketData(symbol, timeframe, windowStart);

    if (data && data.marketDetails) {
      const market = data.market;
      const details = data.marketDetails;
      
      // Получаем цены из marketDetails или используем default
      let closePrice = 0.5; // Default price for binary markets
      
      // Пробуем получить цену из разных источников
      if (details.prices && Array.isArray(details.prices) && details.prices.length > 0) {
        const priceData = details.prices.find((p: any) => p.outcome === 'Yes' || p.outcome === 'Up');
        if (priceData && priceData.price) {
          closePrice = parseFloat(priceData.price);
        }
      }
      
      // Если есть bestOffers
      if (details.bestOffers) {
        const yesOffer = details.bestOffers.yes || details.bestOffers['Yes'];
        if (yesOffer && yesOffer.price) {
          closePrice = parseFloat(yesOffer.price);
        }
      }

      // Для завершенных рынков цена должна быть 0 или 1
      let isExpired = false;
      const endDateValue = market.endDate || (details as any).endDate;
      if (endDateValue) {
        const endDate = new Date(endDateValue).getTime();
        isExpired = endDate < now;
        if (isExpired) {
          // Рынок закрыт - определяем результат
          // Если рынок закрыт, цена должна быть либо 0 либо 1
          // Проверяем через events API
          try {
            const eventsR = await fetch(
              `https://gamma-api.polymarket.com/events/${market.slug || data.slug}?takerWallet=0x0000000000000000000000000000000000000001`,
              {
                signal: AbortSignal.timeout(3000),
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolymarketApp/1.0)' },
              }
            );
            if (eventsR.ok) {
              const eventData = await eventsR.json();
              if (eventData.closed || details.closed) {
                // Рынок закрыт - определяем результат по conditionId
                // Если conditionId существует, значит условие выполнилось
                closePrice = eventData.conditionId ? 1 : 0;
              }
            }
          } catch {
            // Игнорируем ошибку
          }
        }
      }

      // Цена открытия рынка обычно 0.5 для новых рынков Polymarket
      const openPrice = 0.5;

      records.push({
        id: details.id || market.id || `${symbol}-${timeframe}-${windowStart}`,
        symbol,
        timeframe,
        openPrice,
        closePrice,
        changePercent: ((closePrice - openPrice) / openPrice) * 100,
        marketTitle: details.question || market.question || market.title || `${symbol} ${interval.label}`,
        slug: details.slug || market.slug || data.slug,
        marketUrl: `https://polymarket.com/event/${details.slug || market.slug || data.slug}`,
        windowStart,
        windowEnd: windowStart + interval.step,
        isExpired,
        createdAt: new Date(windowStart * 1000).toISOString(),
        volume: details.volume || 0,
      });
    }

    // Небольшая задержка чтобы не перегружать API
    if (i % 50 === 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return records;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.toUpperCase();
  const timeframe = req.nextUrl.searchParams.get('timeframe') || '5min';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');

  if (!symbol || !SUPPORTED_SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol. Supported: ' + SUPPORTED_SYMBOLS.join(', ') }, { status: 400 });
  }

  if (!['5min', '15min'].includes(timeframe)) {
    return NextResponse.json({ error: 'Invalid timeframe. Supported: 5min, 15min' }, { status: 400 });
  }

  if (isNaN(limit) || limit <= 0 || limit > 1000) {
    return NextResponse.json({ error: 'Invalid limit. Max: 1000' }, { status: 400 });
  }

  try {
    console.log(`Fetching alerts data for ${symbol} ${timeframe}, limit: ${limit}`);
    const records = await fetchSymbolHistory(symbol, timeframe, limit);
    
    return NextResponse.json({
      symbol,
      timeframe,
      count: records.length,
      data: records,
    });
  } catch (error: any) {
    console.error('Error fetching alerts data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
