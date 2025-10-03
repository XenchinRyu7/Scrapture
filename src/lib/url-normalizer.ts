import crypto from 'crypto';

const TRACKING_PARAMS = [
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'fbclid', 'gclid', 'msclkid', '_ga', 'mc_cid', 'mc_eid',
  'ref', 'source', 'campaign_id', 'ad_id', 'affiliate_id'
];

const NON_HTML_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.zip', '.rar', '.tar', '.gz', '.7z',
  '.mp3', '.mp4', '.avi', '.mov', '.wmv', '.flv',
  '.css', '.js', '.json', '.xml', '.ico', '.woff', '.woff2', '.ttf', '.eot'
];

export interface NormalizedUrlResult {
  original: string;
  normalized: string;
  hash: string;
  isValid: boolean;
  error?: string;
}

export function normalizeUrl(urlString: string, baseUrl?: string): NormalizedUrlResult {
  try {
    const url = new URL(urlString, baseUrl);
    
    // Lowercase hostname
    url.hostname = url.hostname.toLowerCase();
    
    // Remove default ports
    if ((url.protocol === 'http:' && url.port === '80') ||
        (url.protocol === 'https:' && url.port === '443')) {
      url.port = '';
    }
    
    // Remove fragment
    url.hash = '';
    
    // Sort and remove tracking parameters
    const params = new URLSearchParams(url.search);
    const filteredParams = new URLSearchParams();
    
    Array.from(params.keys())
      .filter(key => !TRACKING_PARAMS.includes(key.toLowerCase()))
      .sort()
      .forEach(key => {
        filteredParams.set(key, params.get(key)!);
      });
    
    url.search = filteredParams.toString();
    
    // Remove trailing slash (except for root)
    let pathname = url.pathname;
    if (pathname !== '/' && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    url.pathname = pathname;
    
    const normalized = url.toString();
    
    return {
      original: urlString,
      normalized,
      hash: hashUrl(normalized),
      isValid: true,
    };
  } catch (error: any) {
    return {
      original: urlString,
      normalized: urlString,
      hash: '',
      isValid: false,
      error: error.message,
    };
  }
}

export function hashUrl(url: string): string {
  return crypto.createHash('sha256').update(url).digest('hex').substring(0, 16);
}

export function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

export function isSameDomain(url1: string, url2: string, includeSubdomains = false): boolean {
  try {
    const u1 = new URL(url1);
    const u2 = new URL(url2);
    
    if (includeSubdomains) {
      const domain1 = u1.hostname.split('.').slice(-2).join('.');
      const domain2 = u2.hostname.split('.').slice(-2).join('.');
      return domain1 === domain2;
    }
    
    return u1.hostname === u2.hostname;
  } catch {
    return false;
  }
}

export function isNonHtmlResource(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    return NON_HTML_EXTENSIONS.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch {
    return '';
  }
}

export function isValidHttpUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

export function calculateUrlPriority(url: string): number {
  const urlObj = new URL(url);
  const pathname = urlObj.pathname.toLowerCase();
  
  // Root has highest priority
  if (pathname === '/' || pathname === '') return 10;
  
  // Category/index pages
  if (pathname.match(/\/(category|categories|archive|tag|tags|index)/)) return 8;
  
  // Sitemap
  if (pathname.includes('sitemap')) return 9;
  
  // Product/article pages
  if (pathname.match(/\/(product|article|post|blog)/)) return 6;
  
  // Pages with few segments (shallow)
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length === 1) return 7;
  if (segments.length === 2) return 5;
  
  // Deep pages
  return Math.max(1, 5 - segments.length);
}
