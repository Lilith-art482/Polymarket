import { NextResponse } from 'next/server';

// CoinDesk RSS - более надёжный источник
const RSS_URL = 'https://www.coindesk.com/arc/outboundfeeds/rss/';

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
    console.log('Запрос к Cryptopanic RSS...');
    
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
    const articles = parseRSS(xmlText);

    console.log(`Получено новостей из RSS: ${articles.length}`);

    return NextResponse.json({
      articles,
      count: articles.length,
      source: 'Cryptopanic RSS',
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

// Парсинг RSS XML вручную (без внешних библиотек)
function parseRSS(xmlText: string): RSSArticle[] {
  const articles: RSSArticle[] = [];
  
  // Разделяем на items
  const items = xmlText.split('<item>');
  
  for (let i = 1; i < items.length; i++) {
    const item = items[i];
    
    // Извлекаем title
    const titleMatch = item.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : 'Без названия';
    
    // Извлекаем link
    const linkMatch = item.match(/<link>(.*?)<\/link>/);
    const link = linkMatch ? linkMatch[1] : '';
    
    // Извлекаем pubDate
    const pubDateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = pubDateMatch ? pubDateMatch[1] : new Date().toISOString();
    
    // Извлекаем description (может быть с CDATA или без)
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
    // Удаляем HTML теги из описания
    description = description.replace(/<[^>]*>/g, '').slice(0, 200);
    
    // Извлекаем изображение (из media:content, enclosure или content:encoded)
    let image: string | undefined;
    const mediaMatch = item.match(/<media:content[^>]*url="([^"]*)"/);
    if (mediaMatch) {
      image = mediaMatch[1];
    } else {
      const enclosureMatch = item.match(/<enclosure[^>]*url="([^"]*)"/);
      if (enclosureMatch) {
        image = enclosureMatch[1];
      } else {
        const imgMatch = item.match(/<content:encoded[^>]*>(.*?)<\/content:encoded>/s);
        if (imgMatch) {
          const imgInContent = imgMatch[1].match(/<img[^>]*src="([^"]*)"/);
          if (imgInContent) {
            image = imgInContent[1];
          }
        }
      }
    }
    
    // Извлекаем источник
    const sourceMatch = item.match(/<dc:creator>(.*?)<\/dc:creator>/);
    const source = sourceMatch ? sourceMatch[1] : 'CoinDesk';
    
    if (link && title !== 'Без названия') {
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
  
  return articles.slice(0, 20); // Ограничиваем до 20 новостей
}
