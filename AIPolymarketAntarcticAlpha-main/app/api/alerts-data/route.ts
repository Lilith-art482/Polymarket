import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE'];

// Получаем все рынки для символа (активные и недавние завершенные)
async function fetchSymbolMarkets(symbol: string, limit: number = 1000) {
  const records: any[] = [];
  const now = Math.floor(Date.now() / 1000);
  
  // Проверяем последние 2000 временных окон (примерно 7 дней по 5 минут)
  const maxWindows = Math.min(limit * 2, 2000);
  
  console.log(`Fetching ${symbol} markets, checking ${maxWindows} windows...`);
  
  for (let i = 0; i < maxWindows && records.length < limit; i++) {
    // Идем от настоящеого времени назад
    const windowStart = now - (i * 300);
    const alignedWindow = Math.floor(windowStart / 300) * 300;
    
    const slug = `${symbol.toLowerCase()}-updown-5m-${alignedWindow}`;
    
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
      const markets = ev.markets || [];
      
      for (const market of markets) {
        const marketId = market.id || market.slug;
        
        // Получаем текущие цены через bestOffers
        let currentPrice = 0.5;
        let closePrice: number | null = null;
        
        // Пытаемся получить цену из outcomePrices
        if (market.outcomePrices) {
          try {
            const prices = JSON.parse(market.outcomePrices);
            if (Array.isArray(prices) && prices.length > 0) {
              currentPrice = parseFloat(prices[0]) || 0.5;
            }
          } catch {}
        }
        
        // Если есть bestOffers
        if (market.bestBid && market.bestAsk) {
          currentPrice = (parseFloat(market.bestBid) + parseFloat(market.bestAsk)) / 2;
        } else if (market.bestBid) {
          currentPrice = parseFloat(market.bestBid);
        } else if (market.lastTradePrice) {
          currentPrice = parseFloat(market.lastTradePrice);
        }
        
        // Определяем статус рынка
        const endDateValue = market.endDate || ev.endDate;
        let isExpired = false;
        
        if (endDateValue) {
          const endDate = new Date(endDateValue).getTime() / 1000;
          isExpired = endDate < now;
        }
        
        // Для завершенных рынков пытаемся получить финальный результат
        if (isExpired && market.conditionId) {
          // Рынок завершен - цена будет 0 или 1
          // Пытаемся получить результат
          try {
            const eventsR = await fetch(
              `https://gamma-api.polymarket.com/events/${ev.slug}`,
              {
                signal: AbortSignal.timeout(3000),
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolymarketApp/1.0)' },
              }
            );
            
            if (eventsR.ok) {
              const eventData = await eventsR.json();
              if (eventData.closed || eventData.resolved) {
                // Определяем результат по conditionId
                closePrice = eventData.conditionId ? 1 : 0;
              }
            }
          } catch {
            // Если не удалось получить результат, используем текущую цену
            closePrice = currentPrice;
          }
        } else if (market.closed || market.resolved) {
          // Рынок помечен как закрытый
          closePrice = currentPrice;
        }
        
        // Цена открытия всегда 0.5 для новых рынков
        const openPrice = 0.5;
        
        records.push({
          id: market.id || `${symbol}-${alignedWindow}`,
          symbol,
          timeframe: '5min',
          openPrice,
          closePrice,
          currentPrice,
          changePercent: closePrice !== null ? ((closePrice - openPrice) / openPrice) * 100 : 0,
          marketTitle: market.question || ev.title || `${symbol} 5m`,
          slug: market.slug || ev.slug,
          marketUrl: `https://polymarket.com/event/${market.slug || ev.slug}`,
          windowStart: alignedWindow,
          windowEnd: alignedWindow + 300,
          isExpired,
          createdAt: new Date(alignedWindow * 1000).toISOString(),
          volume: market.liquidity || ev.liquidity || 0,
          lastTradePrice: market.lastTradePrice || null,
        });
      }
    } catch (error) {
      console.error(`Error fetching ${symbol} market at ${alignedWindow}:`, error);
    }
    
    // Пропускаем слишком старые рынки (больше 7 дней)
    if (i > 2000) break;
  }
  
  return records;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.toUpperCase();
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');

  if (!symbol || !SUPPORTED_SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol. Supported: ' + SUPPORTED_SYMBOLS.join(', ') }, { status: 400 });
  }

  if (isNaN(limit) || limit <= 0 || limit > 1000) {
    return NextResponse.json({ error: 'Invalid limit. Max: 1000' }, { status: 400 });
  }

  try {
    console.log(`Fetching markets for ${symbol}, limit: ${limit}`);
    const records = await fetchSymbolMarkets(symbol, limit);
    
    // Сортируем по времени (сначала новые)
    records.sort((a, b) => b.windowStart - a.windowStart);
    
    return NextResponse.json({
      symbol,
      timeframe: '5min',
      count: records.length,
      data: records.slice(0, limit),
      lastUpdated: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching markets:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
