import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://data-api.polymarket.com';

// Альтернативный API endpoint с большим лимитом
const ALTERNATIVE_BASE_URL = 'https://gamma-api.polymarket.com';

function isValidWallet(addr: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(addr);
}

// Нормализация транзакций из разных форматов API
function normalizeActivities(data: any): any[] {
  if (Array.isArray(data)) return data;
  if (data.trades && Array.isArray(data.trades)) return data.trades;
  if (data.data && Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.events)) return data.events;
  return [];
}

export async function GET(req: NextRequest) {
  let wallet = '';
  try {
    wallet = req.nextUrl.searchParams.get('wallet') || '';
    if (!wallet || !isValidWallet(wallet)) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    // Получаем параметры для пагинации
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10000');
    const before = req.nextUrl.searchParams.get('before');
    const after = req.nextUrl.searchParams.get('after');

    // Пробуем основной API с большим лимитом
    let url = new URL(`${BASE_URL}/activity`);
    url.searchParams.set('user', wallet);
    url.searchParams.set('limit', Math.min(limit, 10000).toString()); // Максимум 10000 за раз

    if (before) url.searchParams.set('before', before);
    if (after) url.searchParams.set('after', after);

    let r = await fetch(url.toString(), {
      headers: { 'accept': 'application/json' },
      signal: AbortSignal.timeout(30000),
    });

    // Если основной API не работает, пробуем альтернативный
    if (!r.ok && r.status === 404) {
      url = new URL(`${ALTERNATIVE_BASE_URL}/trades`);
      url.searchParams.set('user', wallet);
      url.searchParams.set('limit', Math.min(limit, 10000).toString());
      
      if (before) url.searchParams.set('beforeTs', before);
      if (after) url.searchParams.set('afterTs', after);

      r = await fetch(url.toString(), {
        headers: { 'accept': 'application/json' },
        signal: AbortSignal.timeout(30000),
      });
    }

    if (!r.ok) {
      const text = await r.text();
      console.error(`Polymarket API error for ${wallet}:`, r.status, text);
      
      if (r.status === 404 || r.status === 400) {
        return NextResponse.json({
          wallet,
          count: 0,
          data: [],
          message: 'No activity found for this wallet'
        });
      }
      
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
    const activities = normalizeActivities(data);

    // Лог для отладки структуры данных (первая запись)
    if (activities.length > 0) {
      console.log('Sample activity item:', JSON.stringify(activities[0], null, 2));
    }

    return NextResponse.json({
      wallet,
      count: activities.length,
      data: activities,
      hasMore: activities.length >= Math.min(limit, 10000),
    });
  } catch (error: any) {
    console.error(`Error fetching activity for ${wallet}:`, error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
