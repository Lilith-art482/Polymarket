import { NextRequest, NextResponse } from 'next/server';

const INTERVALS = {
  '5min': { step: 300, label: '5m' },
};

const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE'];

// Кэш рынков для отслеживания состояния
const marketCache = new Map<string, {
  data: any;
  lastUpdate: number;
  isOpen: boolean;
  openPrice: number;
  closePrice: number | null;
}>();

// Получаем текущие активные рынки для всех активов
async function fetchActiveMarkets() {
  const now = Math.floor(Date.now() / 1000);
  const allMarkets: any[] = [];
  
  for (const symbol of SUPPORTED_SYMBOLS) {
    try {
      // Ищем рынки в текущем и следующих 2-3 окнах
      const currentWindow = Math.floor(now / 300) * 300;
      
      for (let i = 0; i < 5; i++) {
        const windowStart = currentWindow + i * 300;
        const slug = `${symbol.toLowerCase()}-updown-5m-${windowStart}`;
        
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
          const details = await fetchMarketDetails(marketId);
          
          if (details) {
            const endDate = details.endDate ? new Date(details.endDate).getTime() / 1000 : null;
            const isExpired = endDate ? endDate < now : false;
            
            allMarkets.push({
              id: details.id || marketId,
              symbol,
              marketTitle: details.question || market.question || market.title || `${symbol} 5m`,
              slug: details.slug || market.slug,
              marketUrl: `https://polymarket.com/event/${details.slug || market.slug}`,
              windowStart,
              windowEnd: windowStart + 300,
              openPrice: details.openPrice || 0.5,
              closePrice: details.closePrice || null,
              currentPrice: details.currentPrice || 0.5,
              isExpired,
              endDate,
              volume: details.volume || 0,
              createdAt: new Date(windowStart * 1000).toISOString(),
            });
          }
        }
      }
    } catch (error) {
      console.error(`Error fetching markets for ${symbol}:`, error);
    }
  }
  
  return allMarkets;
}

// Получаем детали рынка с ценами
async function fetchMarketDetails(marketId: string) {
  try {
    const endpoints = [
      `https://gamma-api.polymarket.com/markets/${marketId}`,
      `https://gamma-api.polymarket.com/markets?slug=${marketId}`,
    ];

    for (const endpoint of endpoints) {
      try {
        const r = await fetch(endpoint, {
          signal: AbortSignal.timeout(3000),
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolymarketApp/1.0)' },
        });
        
        if (!r.ok) continue;
        const data = await r.json();
        const marketData = Array.isArray(data) ? data[0] : data;
        
        if (!marketData) continue;
        
        let currentPrice = 0.5;
        let closePrice: number | null = null;
        let openPrice = 0.5;
        let endDate: string | null = null;
        let closed = false;
        
        // Получаем текущую цену
        if (marketData.prices && Array.isArray(marketData.prices)) {
          const priceData = marketData.prices.find((p: any) => 
            p.outcome === 'Yes' || p.outcome === 'Up' || p.outcome === '1'
          );
          if (priceData?.price) {
            currentPrice = parseFloat(priceData.price);
          }
        }
        
        // Если есть bestOffers
        if (marketData.bestOffers) {
          const yesOffer = marketData.bestOffers.yes || marketData.bestOffers['Yes'] || marketData.bestOffers['1'];
          if (yesOffer?.price) {
            currentPrice = parseFloat(yesOffer.price);
          }
        }
        
        endDate = marketData.endDate || null;
        closed = marketData.closed || marketData.resolved || false;
        
        // Если рынок закрыт/разрешен, определяем финальную цену
        if (closed && endDate) {
          const endTs = new Date(endDate).getTime() / 1000;
          const now = Math.floor(Date.now() / 1000);
          
          if (endTs < now) {
            // Рынок уже завершен - пытаемся получить результат
            try {
              const eventsR = await fetch(
                `https://gamma-api.polymarket.com/events/${marketData.slug}?takerWallet=0x0000000000000000000000000000000000000001`,
                {
                  signal: AbortSignal.timeout(3000),
                  headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolymarketApp/1.0)' },
                }
              );
              
              if (eventsR.ok) {
                const eventData = await eventsR.json();
                // Если есть conditionId или resolvedValue, рынок разрешен
                if (eventData.conditionId || eventData.resolved) {
                  // Результат 1 (YES/UP) или 0 (NO/DOWN)
                  closePrice = eventData.conditionId || eventData.resolved === '1' || eventData.resolved === 'yes' ? 1 : 0;
                }
              }
            } catch {
              // Если не удалось получить результат, используем текущую цену
              closePrice = currentPrice;
            }
          } else {
            // Рынок еще не завершен, но помечен как closed
            closePrice = currentPrice;
          }
        } else {
          // Рынок активен
          closePrice = null;
        }
        
        return {
          id: marketData.id || marketId,
          question: marketData.question || marketData.title || '',
          slug: marketData.slug || marketId,
          outcomes: marketData.outcomes || [],
          prices: marketData.prices || [],
          bestOffers: marketData.bestOffers || {},
          endDate,
          closed,
          volume: marketData.volume || 0,
          openPrice,
          closePrice,
          currentPrice,
        };
      } catch {
        continue;
      }
    }
  } catch (error) {
    console.error('Error fetching market details:', error);
  }
  
  return null;
}

// Получаем историю завершенных рынков
async function fetchHistoricalMarkets(symbol: string, limit: number = 1000) {
  const now = Math.floor(Date.now() / 1000);
  const records: any[] = [];
  const maxWindows = limit * 2;
  
  // Идем назад во времени, ищем завершенные рынки
  for (let i = maxWindows; i > 0 && records.length < limit; i--) {
    const windowStart = Math.floor((now - i * 300) / 300) * 300;
    
    // Пропускаем будущие окна
    if (windowStart > now) continue;
    
    const slug = `${symbol.toLowerCase()}-updown-5m-${windowStart}`;
    
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
        const details = await fetchMarketDetails(marketId);
        
        if (details && details.closePrice !== null) {
          records.push({
            id: details.id || marketId,
            symbol,
            timeframe: '5min',
            openPrice: details.openPrice,
            closePrice: details.closePrice,
            changePercent: ((details.closePrice - details.openPrice) / details.openPrice) * 100,
            marketTitle: details.question || market.question || market.title || `${symbol} 5m`,
            slug: details.slug || market.slug,
            marketUrl: `https://polymarket.com/event/${details.slug || market.slug}`,
            windowStart,
            windowEnd: windowStart + 300,
            isExpired: true,
            createdAt: new Date(windowStart * 1000).toISOString(),
            volume: details.volume || 0,
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching historical for ${symbol}:`, error);
    }
    
    // Небольшая задержка
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
  
  return records;
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.toUpperCase();
  const timeframe = req.nextUrl.searchParams.get('timeframe') || '5min';
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '100');
  const mode = req.nextUrl.searchParams.get('mode') || 'all'; // 'all', 'active', 'historical'

  if (!symbol || !SUPPORTED_SYMBOLS.includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol. Supported: ' + SUPPORTED_SYMBOLS.join(', ') }, { status: 400 });
  }

  if (timeframe !== '5min') {
    return NextResponse.json({ error: 'Only 5min timeframe supported' }, { status: 400 });
  }

  if (isNaN(limit) || limit <= 0 || limit > 1000) {
    return NextResponse.json({ error: 'Invalid limit. Max: 1000' }, { status: 400 });
  }

  try {
    console.log(`Fetching alerts data for ${symbol}, mode: ${mode}, limit: ${limit}`);
    
    let records: any[] = [];
    
    if (mode === 'active' || mode === 'all') {
      // Получаем активные рынки
      const activeMarkets = await fetchActiveMarkets();
      const symbolActive = activeMarkets.filter(m => m.symbol === symbol);
      
      if (mode === 'active') {
        records = symbolActive;
      } else {
        records = symbolActive;
      }
    }
    
    if (mode === 'historical' || mode === 'all') {
      // Получаем исторические завершенные рынки
      const historical = await fetchHistoricalMarkets(symbol, limit - records.length);
      records = [...records, ...historical];
    }
    
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
    console.error('Error fetching alerts data:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
