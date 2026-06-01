export interface PolymarketPrices {
  up: number;
  down: number;
  spread: number;
  endDate: string;
}

function safeJsonParse(val: any): any[] {
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val || '[]'); } catch { return []; }
}

function parseMarket(market: any): PolymarketPrices {
  const outcomes: string[] = safeJsonParse(market.outcomes);
  const prices: string[] = safeJsonParse(market.outcomePrices);

  const yesIdx = outcomes.findIndex((o: string) => o === 'Yes');
  const noIdx = outcomes.findIndex((o: string) => o === 'No');

  let upPrice: number;
  let downPrice: number;

  if (yesIdx !== -1 && noIdx !== -1) {
    upPrice = parseFloat(prices[yesIdx]) || 0;
    downPrice = parseFloat(prices[noIdx]) || 0;
  } else if (prices.length >= 2) {
    upPrice = parseFloat(prices[0]) || 0;
    downPrice = parseFloat(prices[1]) || 0;
  } else {
    upPrice = 0;
    downPrice = 0;
  }

  function norm(p: number): number {
    return p <= 1 ? Math.round(p * 100) : Math.round(p);
  }

  return {
    up: norm(upPrice),
    down: norm(downPrice),
    spread: norm(Math.abs(upPrice - downPrice)),
    endDate: market.endDate || market.closeTime || '',
  };
}

export async function fetchPolymarketPrices(marketId: string): Promise<PolymarketPrices> {
  const isNumeric = /^\d+$/.test(marketId);

  if (isNumeric) {
    const res = await fetch(`https://gamma-api.polymarket.com/markets/${marketId}`);
    if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`);
    const market = await res.json();
    if (!market || !market.id) throw new Error('Polymarket API: market not found');
    return parseMarket(market);
  }

  const res = await fetch(`https://gamma-api.polymarket.com/events?slug=${encodeURIComponent(marketId)}`);
  if (!res.ok) throw new Error(`Polymarket API error: ${res.status}`);

  const events = await res.json();
  if (!Array.isArray(events) || events.length === 0) {
    throw new Error(`Polymarket API: event "${marketId}" not found`);
  }

  const markets = events[0]?.markets || [];
  if (markets.length === 0) {
    throw new Error(`Polymarket API: no markets in event "${marketId}"`);
  }

  return parseMarket(markets[0]);
}
