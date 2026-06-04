import { NextRequest, NextResponse } from 'next/server';

const INTERVALS: Record<string, { step: number; label: string }> = {
  '5min': { step: 300, label: '5m' },
  '15min': { step: 900, label: '15m' },
};

function floorTime(ts: number, step: number): number {
  return ts - (ts % step);
}

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.toUpperCase();
  const timeframe = req.nextUrl.searchParams.get('timeframe');

  if (!symbol || !['BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE'].includes(symbol)) {
    return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });
  }

  const intv = timeframe ? INTERVALS[timeframe] : null;
  if (!intv) {
    return NextResponse.json({ error: 'Invalid timeframe' }, { status: 400 });
  }

  const now = Math.floor(Date.now() / 1000);
  const baseStart = floorTime(now, intv.step);
  const sym = symbol.toLowerCase();
  const results: any[] = [];
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
          category: m.category || 'Crypto',
          outcomes: m.outcomes || m.outcomeNames || [],
          url,
        });
        if (results.length >= 5) break;
      }
      if (results.length > 0) break;
    } catch {}
  }

  return NextResponse.json({ markets: results, count: results.length });
}
