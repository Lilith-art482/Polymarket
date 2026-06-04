import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE'];

// Получаем историческую цену актива с Chainlink Data Feeds
async function getAssetPriceAtTime(symbol: string, timestamp: number): Promise<number> {
  try {
    // Chainlink Data Feeds через API aggregator
    // Для BTC/USD на Ethereum mainnet: 0xb49f677943BC038e9857d61E7d053CaA2C1734C1
    
    const symbolConfig: Record<string, { feed: string; coinId: string }> = {
      'BTC': { feed: '0xb49f677943BC038e9857d61E7d053CaA2C1734C1', coinId: 'bitcoin' },
      'ETH': { feed: '0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419', coinId: 'ethereum' },
      'SOL': { feed: '0x12660b50a8909400f34f5c4e42b9c2fe0f7c8c0e', coinId: 'solana' },
      'XRP': { feed: '0xf297b9373794e7eb8c9d2f965a317e7215fcaa0d', coinId: 'ripple' },
      'BNB': { feed: '0xF618a343b9AfC1BbB965A8D57365DeBb928aCf87', coinId: 'binancecoin' },
      'DOGE': { feed: '0x745Ab4b59E8836A538491927c1Ed795908562541', coinId: 'dogecoin' },
    };
    
    const config = symbolConfig[symbol];
    if (!config) return 0;
    
    // Chainlink Price Feed API через etherscan-like endpoint
    // Используем публичный API Chainlink
    const chainlinkUrl = `https://api.chain.link/price/v1?pair=${symbol}/USD&timestamp=${timestamp}`;
    
    try {
      const r = await fetch(chainlinkUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolymarketApp/1.0)' },
      });
      
      if (r.ok) {
        const data = await r.json();
        if (data.data?.price) {
          return parseFloat(data.data.price);
        }
      }
    } catch (chainlinkErr) {
      console.error(`Chainlink failed for ${symbol}:`, chainlinkErr);
    }
    
    // Фолбэк: CoinGecko - но это текущая цена, не историческая
    // Для исторических данных нужен платный API
    const coingeckoUrl = `https://api.coingecko.com/api/v3/coins/${config.coinId}/market_chart?vs_currency=usd&days=1`;
    
    try {
      const cgRes = await fetch(coingeckoUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolymarketApp/1.0)' },
      });
      
      if (cgRes.ok) {
        const cgData = await cgRes.json();
        if (cgData.prices && cgData.prices.length > 0) {
          // Находим цену ближе всего к timestamp
          const targetTime = timestamp * 1000;
          let closestPrice = cgData.prices[0][1];
          let minDiff = Math.abs(targetTime - cgData.prices[0][0]);
          
          for (const [time, price] of cgData.prices) {
            const diff = Math.abs(targetTime - time);
            if (diff < minDiff) {
              minDiff = diff;
              closestPrice = price;
            }
          }
          
          return closestPrice;
        }
      }
    } catch (cgErr) {
      console.error(`CoinGecko failed for ${symbol}:`, cgErr);
    }
    
    return 0;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return 0;
  }
}

// Получаем только ЗАВЕРШЕННЫЕ рынки с реальными ценами
async function fetchActiveMarkets(symbol: string, limit: number = 1000) {
  const records: any[] = [];
  const now = Math.floor(Date.now() / 1000);
  
  // Проверяем только прошедшие окна (будущие не показываем)
  // 500 рынков = 500 * 5 минут = ~170 часов = ~7 дней
  // Проверяем с запасом 2x чтобы найти 500 рынков
  const maxWindowsToCheck = limit * 2;
  
  console.log(`Fetching ${symbol} markets, checking ${maxWindowsToCheck} windows...`);
  
  // Начинаем с текущего окна и идем НАЗАД во времени
  const currentWindow = Math.floor(now / 300) * 300;
  
  for (let i = 0; i < maxWindowsToCheck && records.length < limit; i++) {
    // Идем назад во времени (от текущего к прошлому)
    const windowStart = currentWindow - (i * 300);
    const windowEnd = windowStart + 300;
    
    // Пропускаем если окно в будущем
    if (windowStart >= now) continue;
    
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
      if (markets.length === 0) continue;
      
      // Определяем статус рынка по endDate
      const endDateValue = ev.endDate;
      let isExpired = false;
      
      if (endDateValue) {
        const endDate = new Date(endDateValue).getTime() / 1000;
        isExpired = endDate < now;
      }
      
      // Если рынок еще не завершен, пропускаем его
      if (!isExpired) continue;
      
      // Для КАЖДОГО рынка получаем ОТДЕЛЬНЫЕ цены
      for (const market of markets) {
        let openPrice = 0;
        let closePrice = 0;
        
        try {
          // Цена открытия = цена актива НА НАЧАЛО периода
          openPrice = await getAssetPriceAtTime(symbol, windowStart);
          
          // Цена закрытия = цена актива НА КОНЕЦ периода
          closePrice = await getAssetPriceAtTime(symbol, windowEnd);
        } catch (priceError) {
          console.error(`Price fetch error for ${symbol} at ${windowStart}:`, priceError);
        }
        
        records.push({
          id: market.id || `${symbol}-${windowStart}`,
          symbol,
          timeframe: '5min',
          openPrice,
          closePrice,
          changePercent: (openPrice > 0 && closePrice > 0) ? ((closePrice - openPrice) / openPrice) * 100 : 0,
          marketTitle: market.question || ev.title || `${symbol} 5m`,
          slug: market.slug || ev.slug,
          marketUrl: `https://polymarket.com/event/${market.slug || ev.slug}`,
          windowStart,
          windowEnd,
          isExpired: true,
          createdAt: new Date(windowStart * 1000).toISOString(),
          volume: market.liquidity || ev.liquidity || 0,
        });
      }
    } catch (error) {
      console.error(`Error fetching ${symbol} market at ${windowStart}:`, error);
    }
    
    // Небольшая задержка чтобы не перегружать API
    if (i % 100 === 0) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
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
    const records = await fetchActiveMarkets(symbol, limit);
    
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
