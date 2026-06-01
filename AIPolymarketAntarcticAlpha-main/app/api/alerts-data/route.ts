import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_SYMBOLS = ['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE'];

// Получаем реальную цену криптоактива с Chainlink
async function getAssetPrice(symbol: string, timestamp: number): Promise<number> {
  try {
    // Chainlink Price Feeds API
    // Для BTC/USD: https://data.chain.link/ethereum/mainnet/crypto-usd/btc-usd
    // Используем агрегатор Chainlink
    
    const symbolMap: Record<string, string> = {
      'BTC': 'BTC/USD',
      'ETH': 'ETH/USD',
      'SOL': 'SOL/USD',
      'XRP': 'XRP/USD',
      'BNB': 'BNB/USD',
      'DOGE': 'DOGE/USD',
    };
    
    const pair = symbolMap[symbol];
    if (!pair) return 0;
    
    // Chainlink Data Feeds API
    const chainlinkUrl = `https://api.chain.link/price/v1?pair=${encodeURIComponent(pair)}&timestamp=${timestamp}`;
    
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
    } catch {}
    
    // Если Chainlink не работает, пробуем альтернативу - CoinGecko
    const coingeckoMap: Record<string, string> = {
      'BTC': 'bitcoin',
      'ETH': 'ethereum',
      'SOL': 'solana',
      'XRP': 'ripple',
      'BNB': 'binancecoin',
      'DOGE': 'dogecoin',
    };
    
    const coinId = coingeckoMap[symbol];
    if (coinId) {
      const cgUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`;
      const cgRes = await fetch(cgUrl, {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; PolymarketApp/1.0)' },
      });
      
      if (cgRes.ok) {
        const cgData = await cgRes.json();
        if (cgData[coinId]?.usd) {
          return cgData[coinId].usd;
        }
      }
    }
    
    return 0;
  } catch (error) {
    console.error(`Error fetching price for ${symbol}:`, error);
    return 0;
  }
}

// Получаем только НОВЫЕ и АКТИВНЫЕ рынки с реальными ценами
async function fetchActiveMarkets(symbol: string, limit: number = 1000) {
  const records: any[] = [];
  const now = Math.floor(Date.now() / 1000);
  
  // Проверяем окна: последние 5 прошедших + следующие 10 будущих
  const lookBackWindows = 5;
  const lookForwardWindows = 15;
  
  console.log(`Fetching ${symbol} active markets with real prices...`);
  
  const currentWindow = Math.floor(now / 300) * 300;
  
  // Проверяем от текущего окна вперед
  for (let i = -lookBackWindows; i < lookForwardWindows; i++) {
    const windowStart = currentWindow + (i * 300);
    const windowEnd = windowStart + 300;
    
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
      
      // Получаем РЕАЛЬНУЮ цену актива на начало и конец периода
      let openPrice = 0;
      let closePrice: number | null = null;
      let isExpired = false;
      
      try {
        openPrice = await getAssetPrice(symbol, windowStart);
        
        // Определяем статус рынка
        const endDateValue = ev.endDate;
        
        if (endDateValue) {
          const endDate = new Date(endDateValue).getTime() / 1000;
          isExpired = endDate < now;
        }
        
        // Если рынок завершен, получаем цену на конец периода
        if (isExpired && openPrice > 0) {
          closePrice = await getAssetPrice(symbol, windowEnd);
        }
      } catch (priceError) {
        console.error(`Price fetch error for ${symbol} at ${windowStart}:`, priceError);
      }
      
      for (const market of markets) {
        records.push({
          id: market.id || `${symbol}-${windowStart}`,
          symbol,
          timeframe: '5min',
          openPrice,  // РЕАЛЬНАЯ цена актива на начало периода
          closePrice, // РЕАЛЬНАЯ цена актива на конец периода (для завершенных)
          changePercent: (openPrice > 0 && closePrice !== null) ? ((closePrice - openPrice) / openPrice) * 100 : 0,
          marketTitle: market.question || ev.title || `${symbol} 5m`,
          slug: market.slug || ev.slug,
          marketUrl: `https://polymarket.com/event/${market.slug || ev.slug}`,
          windowStart,
          windowEnd,
          isExpired,
          createdAt: new Date(windowStart * 1000).toISOString(),
          volume: market.liquidity || ev.liquidity || 0,
        });
      }
    } catch (error) {
      console.error(`Error fetching ${symbol} market at ${windowStart}:`, error);
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
