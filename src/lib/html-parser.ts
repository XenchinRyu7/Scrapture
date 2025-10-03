import * as cheerio from 'cheerio';

export interface ParsedHTML {
  title: string;
  metaDescription: string;
  metaKeywords: string;
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
  };
  links: Array<{
    href: string;
    text: string;
    rel?: string;
  }>;
  images: Array<{
    src: string;
    alt: string;
  }>;
  bodyText: string;
  wordCount: number;
}

export function parseHTML(html: string, baseUrl?: string): ParsedHTML {
  const $ = cheerio.load(html);

  // Extract title
  const title = $('title').text().trim() || 
                $('meta[property="og:title"]').attr('content') || 
                $('h1').first().text().trim() || '';

  // Extract meta description
  const metaDescription = $('meta[name="description"]').attr('content') || 
                          $('meta[property="og:description"]').attr('content') || '';

  // Extract meta keywords
  const metaKeywords = $('meta[name="keywords"]').attr('content') || '';

  // Extract headings
  const headings = {
    h1: $('h1').map((_, el) => $(el).text().trim()).get(),
    h2: $('h2').map((_, el) => $(el).text().trim()).get(),
    h3: $('h3').map((_, el) => $(el).text().trim()).get(),
  };

  // Extract links
  const links = $('a[href]').map((_, el) => {
    const $el = $(el);
    return {
      href: $el.attr('href') || '',
      text: $el.text().trim(),
      rel: $el.attr('rel'),
    };
  }).get();

  // Extract images
  const images = $('img[src]').map((_, el) => {
    const $el = $(el);
    return {
      src: $el.attr('src') || '',
      alt: $el.attr('alt') || '',
    };
  }).get();

  // Extract body text
  $('script, style, noscript').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

  // Word count
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

  return {
    title,
    metaDescription,
    metaKeywords,
    headings,
    links,
    images,
    bodyText: bodyText.substring(0, 10000), // Limit to 10k chars
    wordCount,
  };
}

export function extractJSONLD(html: string): Array<any> {
  const $ = cheerio.load(html);
  const jsonLdScripts: Array<any> = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        const parsed = JSON.parse(content);
        jsonLdScripts.push(parsed);
      }
    } catch (error) {
      // Invalid JSON, skip
    }
  });

  return jsonLdScripts;
}

export interface ExtractedMetadata {
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  ogUrl?: string;
  author?: string;
  publishDate?: string;
  modifiedDate?: string;
  language?: string;
  robots?: string;
}

export function extractMetadata(html: string): ExtractedMetadata {
  const $ = cheerio.load(html);

  return {
    canonical: $('link[rel="canonical"]').attr('href'),
    ogType: $('meta[property="og:type"]').attr('content'),
    ogImage: $('meta[property="og:image"]').attr('content'),
    ogUrl: $('meta[property="og:url"]').attr('content'),
    author: $('meta[name="author"]').attr('content') || 
            $('meta[property="article:author"]').attr('content'),
    publishDate: $('meta[property="article:published_time"]').attr('content') ||
                 $('time[datetime]').first().attr('datetime'),
    modifiedDate: $('meta[property="article:modified_time"]').attr('content'),
    language: $('html').attr('lang') || $('meta[http-equiv="content-language"]').attr('content'),
    robots: $('meta[name="robots"]').attr('content'),
  };
}

export interface CustomExtractorConfig {
  selectors: {
    [key: string]: string;
  };
  extractType?: 'text' | 'html' | 'attr';
  attr?: string;
}

export function customExtract(html: string, config: CustomExtractorConfig): Record<string, any> {
  const $ = cheerio.load(html);
  const result: Record<string, any> = {};

  for (const [key, selector] of Object.entries(config.selectors)) {
    try {
      const elements = $(selector);
      
      if (elements.length === 0) {
        result[key] = null;
        continue;
      }

      const extractType = config.extractType || 'text';
      
      if (elements.length === 1) {
        if (extractType === 'text') {
          result[key] = elements.text().trim();
        } else if (extractType === 'html') {
          result[key] = elements.html();
        } else if (extractType === 'attr' && config.attr) {
          result[key] = elements.attr(config.attr);
        }
      } else {
        // Multiple elements
        result[key] = elements.map((_, el) => {
          const $el = $(el);
          if (extractType === 'text') {
            return $el.text().trim();
          } else if (extractType === 'html') {
            return $el.html();
          } else if (extractType === 'attr' && config.attr) {
            return $el.attr(config.attr);
          }
          return null;
        }).get();
      }
    } catch (error) {
      result[key] = null;
    }
  }

  return result;
}
