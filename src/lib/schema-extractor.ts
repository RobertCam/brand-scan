import * as cheerio from 'cheerio';
import { SchemaMetadata } from '@/types/brand-analysis';

export async function extractSchemaMetadata(url: string): Promise<SchemaMetadata> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BrandScan/1.0; +https://brandscan.ai)',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const metadata: SchemaMetadata = {
      url,
      title: $('title').text().trim() || undefined,
      description: $('meta[name="description"]').attr('content') || undefined,
    };

    // Extract JSON-LD structured data
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}');
        
        if (Array.isArray(jsonData)) {
          jsonData.forEach((item) => {
            extractSchemaType(item, metadata);
          });
        } else {
          extractSchemaType(jsonData, metadata);
        }
      } catch (error) {
        console.warn('Failed to parse JSON-LD:', error);
      }
    });

    // Extract microdata
    $('[itemscope]').each((_, element) => {
      const itemType = $(element).attr('itemtype');
      if (itemType?.includes('schema.org')) {
        const microdata = extractMicrodata($ as cheerio.CheerioAPI, element);
        extractSchemaType(microdata, metadata);
      }
    });

    return metadata;
  } catch (error) {
    console.error(`Failed to extract metadata from ${url}:`, error);
    return { url };
  }
}

function extractSchemaType(data: Record<string, unknown>, metadata: SchemaMetadata) {
  if (!data['@type']) return;

  const type = Array.isArray(data['@type']) ? data['@type'][0] : data['@type'];

  switch (type) {
    case 'Organization':
      metadata.organization = data;
      break;
    case 'Product':
      metadata.product = data;
      break;
    case 'FAQPage':
      metadata.faqPage = data;
      break;
    case 'Review':
    case 'AggregateRating':
      metadata.review = data;
      break;
  }
}

function extractMicrodata($: cheerio.CheerioAPI, element: cheerio.Element): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  
  const itemType = $(element).attr('itemtype');
  if (itemType) {
    result['@type'] = itemType.split('/').pop();
  }

  $(element).find('[itemprop]').each((_, prop) => {
    const propName = $(prop).attr('itemprop');
    const propValue = $(prop).text().trim() || $(prop).attr('content');
    
    if (propName && propValue) {
      result[propName] = propValue;
    }
  });

  return result;
}

export async function extractMultipleSchemas(urls: string[]): Promise<SchemaMetadata[]> {
  const promises = urls.map(url => extractSchemaMetadata(url));
  return Promise.all(promises);
}

