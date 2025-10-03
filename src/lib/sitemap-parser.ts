interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: string;
  priority?: string;
}

export async function parseSitemap(sitemapUrl: string): Promise<string[]> {
  const urls: string[] = [];
  
  try {
    const response = await fetch(sitemapUrl);
    if (!response.ok) return urls;
    
    const text = await response.text();
    
    // Check if it's a sitemap index
    if (text.includes('<sitemapindex')) {
      const sitemapUrls = extractSitemapUrls(text);
      for (const url of sitemapUrls) {
        const subUrls = await parseSitemap(url);
        urls.push(...subUrls);
      }
    } else {
      // Parse regular sitemap
      urls.push(...extractUrlsFromSitemap(text));
    }
  } catch (error) {
    console.error('Error parsing sitemap:', error);
  }
  
  return urls;
}

function extractSitemapUrls(xml: string): string[] {
  const urls: string[] = [];
  const locRegex = /<loc>(.*?)<\/loc>/g;
  let match;
  
  while ((match = locRegex.exec(xml)) !== null) {
    urls.push(match[1]);
  }
  
  return urls;
}

function extractUrlsFromSitemap(xml: string): string[] {
  return extractSitemapUrls(xml);
}

export async function discoverSitemaps(baseUrl: string): Promise<string[]> {
  const possibleSitemaps = [
    '/sitemap.xml',
    '/sitemap_index.xml',
    '/sitemap-index.xml',
    '/sitemap1.xml',
    '/sitemaps/sitemap.xml',
  ];
  
  const found: string[] = [];
  
  for (const path of possibleSitemaps) {
    try {
      const url = new URL(path, baseUrl).toString();
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        found.push(url);
      }
    } catch {
      // Silent fail
    }
  }
  
  // Also check robots.txt for sitemap
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();
    const response = await fetch(robotsUrl);
    if (response.ok) {
      const text = await response.text();
      const sitemapMatches = text.match(/Sitemap:\s*(.+)/gi);
      if (sitemapMatches) {
        for (const match of sitemapMatches) {
          const url = match.split(':').slice(1).join(':').trim();
          if (url && !found.includes(url)) {
            found.push(url);
          }
        }
      }
    }
  } catch {
    // Silent fail
  }
  
  return found;
}
