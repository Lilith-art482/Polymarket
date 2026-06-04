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
    
    // Обработка ошибки 429 (too many requests)
    if (response.status === 429) {
      throw new Error(`GNews API rate limit exceeded. Please wait a minute.`);
    }
    
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
    const [enData, ruData] = await Promise.allSettled([
      fetchNews('en', GNEWS_TOKEN, from),
      fetchNews('ru', GNEWS_TOKEN, from),
    ]);

    // Собираем статьи из успешных запросов
    let allArticles: any[] = [];
    
    if (enData.status === 'fulfilled') {
      allArticles = [...(enData.value?.articles || [])];
      console.log(`EN новостей: ${enData.value?.articles?.length || 0}`);
    } else {
      console.warn('EN запрос не удался:', enData.reason);
    }
    
    if (ruData.status === 'fulfilled') {
      allArticles = [...allArticles, ...(ruData.value?.articles || [])];
      console.log(`RU новостей: ${ruData.value?.articles?.length || 0}`);
    } else {
      console.warn('RU запрос не удался:', ruData.reason);
    }

    // Если оба запроса не удались
    if (allArticles.length === 0) {
      const enError = enData.status === 'rejected' ? (enData.reason as Error)?.message : '';
      const ruError = ruData.status === 'rejected' ? (ruData.reason as Error)?.message : '';
      
      if (enError.includes('rate limit') || ruError.includes('rate limit')) {
        return NextResponse.json({
          error: 'Превышен лимит запросов к GNews API. Подождите минуту и обновите страницу.',
          articles: [],
          count: 0,
          fetchedAt: new Date().toISOString(),
        }, { status: 429 });
      }
      
      throw new Error(`Оба запроса не удались: EN=${enError}, RU=${ruError}`);
    }

    // Сортируем по дате публикации
    allArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    // Убираем дубликаты по URL и ограничиваем до 20 новостей
    const uniqueArticles = allArticles.filter(
      (article, index, self) =>
        index === self.findIndex(a => a.url === article.url)
    ).slice(0, 20);

    console.log(`Всего новостей: ${uniqueArticles.length}`);

    return NextResponse.json({
      articles: uniqueArticles,
      count: uniqueArticles.length,
      fetchedAt: new Date().toISOString(),
    }, {
      headers: {
        // Кэшируем на 1 минуту чтобы не превышать лимит API
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
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
