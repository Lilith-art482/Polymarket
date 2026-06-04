import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://gnews.io/api/v4/search';

async function fetchNews(lang: string, token: string, from: string) {
  const url = new URL(BASE_URL);
  url.searchParams.set('q', 'bitcoin ethereum cryptocurrency crypto');
  url.searchParams.set('lang', lang);
  url.searchParams.set('max', '10');
  url.searchParams.set('sortby', 'publishedAt');
  url.searchParams.set('from', from);
  url.searchParams.set('token', token);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GNews API error (${lang}): ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function GET(req: NextRequest) {
  const GNEWS_TOKEN = process.env.GNEWS_TOKEN;
  
  if (!GNEWS_TOKEN) {
    console.error('GNEWS_TOKEN отсутствует в .env.local');
    return NextResponse.json(
      { error: 'GNEWS_TOKEN not configured. Check .env.local file.' },
      { status: 500 }
    );
  }

  try {
    // Новости за последние 24 часа
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Параллельно запрашиваем новости на английском и русском
    const [enData, ruData] = await Promise.all([
      fetchNews('en', GNEWS_TOKEN, from),
      fetchNews('ru', GNEWS_TOKEN, from),
    ]);

    // Объединяем и сортируем по дате публикации
    const allArticles = [
      ...(enData.articles || []),
      ...(ruData.articles || []),
    ].sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Убираем дубликаты по URL и ограничиваем до 20 новостей
    const uniqueArticles = allArticles.filter(
      (article, index, self) =>
        index === self.findIndex(a => a.url === article.url)
    ).slice(0, 20);

    console.log(`Получено новостей: EN=${enData.articles?.length || 0}, RU=${ruData.articles?.length || 0}, Всего=${uniqueArticles.length}`);

    return NextResponse.json({
      articles: uniqueArticles,
      count: uniqueArticles.length,
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
