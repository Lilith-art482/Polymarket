import { NextRequest, NextResponse } from 'next/server';

const BASE_URL = 'https://gnews.io/api/v4/search';
const RSS_URL = 'https://cryptopanic.com/news/rss/';

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
    
    if (response.status === 429) {
      throw new Error(`GNews API rate limit exceeded`);
    }
    
    throw new Error(`GNews API error (${lang}): ${response.status}`);
  }

  return response.json();
}

// Парсинг RSS Cryptopanic как фоллбэк
async function fetchRSSNews(): Promise<any[]> {
  console.log('Запрос к Cryptopanic RSS...');
  
  const response = await fetch(RSS_URL, {
    method: 'GET',
    headers: {
      'Accept': 'application/rss+xml, application/xml, text/xml',
    },
  });

  if (!response.ok) {
    throw new Error(`RSS fetch error: ${response.status}`);
  }

  const xmlText = await response.text();
  const articles: any[] = [];
  
  const items = xmlText.split('<item>');
  
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    
    const titleMatch = item.match(/<title><!\[CDATA\[(.*?)\]\]>/);
    const title = titleMatch ? titleMatch[1] : item.match(/<title>(.*?)<\/title>/)?.[1] || 'Без названия';
    
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    const link = linkMatch ? linkMatch[1] : '';
    
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const publishedAt = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
    
    const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]>/);
    let description = descMatch ? descMatch[1] : '';
    description = description.replace(/<[^>]*>/g, '').slice(0, 200);
    
    let image: string | null = null;
    const mediaMatch = item.match(/<media:content[^>]*url="([^"]*)"/);
    if (mediaMatch) {
      image = mediaMatch[1];
    }
    
    const sourceMatch = item.match(/<dc:creator><!\[CDATA\[(.*?)\]\]>/);
    const sourceName = sourceMatch ? sourceMatch[1] : 'CryptoPanic';
    
    if (link) {
      articles.push({
        title,
        description: description || null,
        url: link,
        image,
        publishedAt,
        source: { name: sourceName, url: link },
      });
    }
  }
  
  return articles;
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
    const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    let allArticles: any[] = [];
    let usedRSS = false;
    
    // Пробуем GNews API (EN + RU)
    const [enData, ruData] = await Promise.allSettled([
      fetchNews('en', GNEWS_TOKEN, from),
      fetchNews('ru', GNEWS_TOKEN, from),
    ]);
    
    if (enData.status === 'fulfilled') {
      allArticles = [...(enData.value?.articles || [])];
      console.log(`EN новостей: ${enData.value?.articles?.length || 0}`);
    }
    
    if (ruData.status === 'fulfilled') {
      allArticles = [...allArticles, ...(ruData.value?.articles || [])];
      console.log(`RU новостей: ${ruData.value?.articles?.length || 0}`);
    }

    // Если GNews не сработал — используем RSS
    if (allArticles.length === 0) {
      console.warn('GNews не вернул новостей, пробуем RSS...');
      try {
        allArticles = await fetchRSSNews();
        usedRSS = true;
        console.log(`RSS новостей: ${allArticles.length}`);
      } catch (rssError: any) {
        console.error('RSS тоже не сработал:', rssError.message);
      }
    }

    // Если всё ещё пусто
    if (allArticles.length === 0) {
      const enError = enData.status === 'rejected' ? (enData.reason as Error)?.message : '';
      const ruError = ruData.status === 'rejected' ? (ruData.reason as Error)?.message : '';
      
      if (enError.includes('rate limit') || ruError.includes('rate limit')) {
        return NextResponse.json({
          error: 'Превышен лимит запросов к GNews API. Подождите несколько минут.',
          articles: [],
          count: 0,
          fetchedAt: new Date().toISOString(),
        }, { status: 429 });
      }
      
      return NextResponse.json({
        error: 'Новости временно недоступны',
        articles: [],
        count: 0,
        fetchedAt: new Date().toISOString(),
      }, { status: 500 });
    }

    // Сортируем и убираем дубликаты
    allArticles.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    const uniqueArticles = allArticles.filter(
      (article, index, self) =>
        index === self.findIndex(a => a.url === article.url)
    ).slice(0, 20);

    console.log(`Всего новостей: ${uniqueArticles.length} (${usedRSS ? 'RSS' : 'GNews'})`);

    return NextResponse.json({
      articles: uniqueArticles,
      count: uniqueArticles.length,
      fetchedAt: new Date().toISOString(),
      source: usedRSS ? 'Cryptopanic RSS' : 'GNews API',
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
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
