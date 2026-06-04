import { NextResponse } from 'next/server';

// CoinDesk RSS - более надёжный источник
const RSS_URL = 'https://www.coindesk.com/arc/outboundfeeds/rss/';

// API для перевода (бесплатный, без ключа)
const TRANSLATE_API = 'https://api.mymemory.translated.net/get';

interface RSSArticle {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description?: string;
  image?: string;
}

export async function GET() {
  try {
    console.log('Запрос к CoinDesk RSS...');
    
    const response = await fetch(RSS_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/rss+xml, application/xml, text/xml',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      // Кэшируем на 5 минут
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error(`RSS ошибка: ${response.status} ${response.statusText}`);
      throw new Error(`RSS fetch error: ${response.status}`);
    }

    const xmlText = await response.text();
    // Переводим на русский
    const articles = await parseRSS(xmlText, true);

    console.log(`Получено новостей из RSS: ${articles.length}`);

    return NextResponse.json({
      articles,
      count: articles.length,
      source: 'CoinDesk RSS (переведено на русский)',
      fetchedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('=== Ошибка в /api/news-rss ===');
    console.error(error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch RSS feed', articles: [], count: 0 },
      { status: 500 }
    );
  }
}

// Перевод текста на русский
async function translateToRussian(text: string): Promise<string> {
  if (!text || text.length < 5) return text;
  
  try {
    const url = new URL(TRANSLATE_API);
    url.searchParams.set('q', text.slice(0, 500)); // Лимит 500 символов
    url.searchParams.set('langpair', 'en|ru');
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn('Ошибка перевода:', response.status);
      return text;
    }
    
    const data = await response.json();
    return data.responseData?.translatedText || text;
  } catch (error) {
    console.warn('Перевод не удался:', error);
    return text;
  }
}

// Парсинг RSS XML вручную (без внешних библиотек)
async function parseRSS(xmlText: string, translate: boolean = false): Promise<RSSArticle[]> {
  const articles: RSSArticle[] = [];
  
  // Разделяем на items
  const items = xmlText.split('<item>');
  
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    
    // Извлекаем title
    const titleMatch = item.match(/<title>(.*?)<\/title>/);
    let title = titleMatch ? titleMatch[1] : 'Без названия';
    
    // Извлекаем link
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    const link = linkMatch ? linkMatch[1] : '';
    
    // Извлекаем pubDate
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
    
    // Извлекаем description
    let description = '';
    const descMatch = item.match(/<description><!\[CDATA\[(.*?)\]\]>/);
    if (descMatch) {
      description = descMatch[1];
    } else {
      const descMatch2 = item.match(/<description>(.*?)<\/description>/);
      if (descMatch2) {
        description = descMatch2[1];
      }
    }
    // Удаляем HTML теги
    description = description.replace(/<[^>]*>/g, '').slice(0, 200);
    
    // Извлекаем изображение
    let image: string | undefined;
    const mediaMatch = item.match(/<media:content[^>]*url="([^"]*)"/);
    if (mediaMatch) {
      image = mediaMatch[1];
    } else {
      const enclosureMatch = item.match(/<enclosure[^>]*url="([^"]*)"/);
      if (enclosureMatch) {
        image = enclosureMatch[1];
      }
    }
    
    // Извлекаем источник
    const sourceMatch = item.match(/<dc:creator>(.*?)<\/dc:creator>/);
    const source = sourceMatch ? sourceMatch[1] : 'CoinDesk';
    
    if (link && title !== 'Без названия') {
      // Переводим если нужно
      if (translate) {
        const [translatedTitle, translatedDesc] = await Promise.all([
          translateToRussian(title),
          description ? translateToRussian(description) : Promise.resolve(''),
        ]);
        title = translatedTitle;
        description = translatedDesc;
      }
      
      articles.push({
        title,
        link,
        pubDate,
        source,
        description: description || undefined,
        image,
      });
    }
  }
  
  return articles.slice(0, 20);
}
