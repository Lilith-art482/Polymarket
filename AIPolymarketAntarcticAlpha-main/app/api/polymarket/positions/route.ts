import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://data-api.polymarket.com';

function isValidWallet(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

export async function GET(req: NextRequest) {
  try {
    const wallet = req.nextUrl.searchParams.get('wallet');
    if (!wallet || !isValidWallet(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const url = new URL(`${BASE_URL}/positions`);
    url.searchParams.set('user', wallet);
    url.searchParams.set('limit', '100');

    const params = ['limit', 'offset', 'market', 'sizeThreshold', 'sortBy', 'sortDirection'] as const;
    for (const p of params) {
      const v = req.nextUrl.searchParams.get(p);
      if (v) url.searchParams.set(p, v);
    }

    const r = await fetch(url.toString(), {
      headers: { 
        'accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!r.ok) {
      const text = await r.text();
      console.error(`Polymarket API error for ${wallet}:`, r.status, text);
      return NextResponse.json(
        { 
          error: 'Polymarket API request failed', 
          status: r.status,
          details: text.substring(0, 500)
        }, 
        { status: r.status }
      );
    }

    const data = await r.json();

    // Нормализуем ответ
    const positions = Array.isArray(data) ? data : 
                     (data.positions && Array.isArray(data.positions)) ? data.positions :
                     (data.data && Array.isArray(data.data)) ? data.data :
                     [];

    return NextResponse.json({
      wallet,
      count: positions.length,
      data: positions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
