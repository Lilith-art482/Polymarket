import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://gnews.io/api/v4/search';

export async function GET(req: NextRequest) {
  console.log('=== /api/news вызван ===');
  console.log('GNEWS_TOKEN из env:', process.env.GNEWS_TOKEN ? '✓ найден' : '✗ не найден');
  
  const GNEWS_TOKEN = process.env.GNEWS_TOKEN;
  
  if (!GNEWS_TOKEN) {
    console.error('GNEWS_TOKEN отсутствует в .env.local');
    return NextResponse.json(
      { error: 'GNEWS_TOKEN not configured. Check .env.local file.' },
      { status: 500 }
    );
  }

  try {
    const query = '("cryptocurrency" OR "bitcoin" OR "ethereum" OR "defi") AND ("regulation" OR "SEC" OR "ETF" OR "price" OR "market") -"sponsored"';
    const from = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const url = new URL(BASE_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('lang', 'en');
    url.searchParams.set('max', '10');
    url.searchParams.set('sortby', 'publishedAt');
    url.searchParams.set('from', from);
    url.searchParams.set('token', GNEWS_TOKEN);

    console.log('Запрос к GNews:', url.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('Статус ответа GNews:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('GNews ошибка:', response.status, errorText);
      throw new Error(`GNews API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Получено статей:', data.articles?.length || 0);

    return NextResponse.json({
      articles: data.articles || [],
      count: data.articles?.length || 0,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('=== Ошибка в /api/news ===');
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
