import { NextRequest, NextResponse } from 'next/server';
import { fetchPolymarketPrices } from '@/lib/polymarket';

export async function GET(req: NextRequest) {
  try {
    const marketId = req.nextUrl.searchParams.get('marketId');
    if (!marketId) {
      return NextResponse.json({ error: 'Missing marketId' }, { status: 400 });
    }

    const pm = await fetchPolymarketPrices(marketId);
    return NextResponse.json(pm);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
