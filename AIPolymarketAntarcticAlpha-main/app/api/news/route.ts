import { NextResponse } from 'next/server';

const GNEWS_TOKEN = process.env.GNEWS_TOKEN;
const BASE_URL = 'https://gnews.io/api/v4/search';

export interface NewsArticle {
  title: string;
  description: string | null;
  url: string;
  image: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
}

export async function GET() {
  console.log('GNEWS_TOKEN:', GNEWS_TOKEN ? 'present' : 'missing');
  
  if (!GNEWS_TOKEN) {
    console.error('GNEWS_TOKEN is not configured');
    return NextResponse.json(
      { error: 'GNEWS_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    // Ключевые слова: крипта + важные финансовые термины
    const query = '("cryptocurrency" OR "bitcoin" OR "ethereum" OR "defi") AND ("regulation" OR "SEC" OR "ETF" OR "price" OR "market") -"sponsored"';
    
    // Новости за последние 2 часа
    const from = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

    const url = new URL(BASE_URL);
    url.searchParams.set('q', query);
    url.searchParams.set('lang', 'en');
    url.searchParams.set('max', '10');
    url.searchParams.set('sortby', 'publishedAt');
    url.searchParams.set('from', from);
    url.searchParams.set('token', GNEWS_TOKEN);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GNews API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const articles: NewsArticle[] = data.articles || [];

    return NextResponse.json({
      articles,
      count: articles.length,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch news' },
      { status: 500 }
    );
  }
}
