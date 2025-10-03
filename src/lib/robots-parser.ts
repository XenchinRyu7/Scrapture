export interface RobotsRules {
  isAllowed: (url: string, userAgent?: string) => boolean;
  crawlDelay?: number;
  sitemaps: string[];
}

export async function parseRobotsTxt(baseUrl: string, userAgent = '*'): Promise<RobotsRules> {
  const rules: RobotsRules = {
    isAllowed: () => true,
    sitemaps: [],
  };
  
  try {
    const robotsUrl = new URL('/robots.txt', baseUrl).toString();
    const response = await fetch(robotsUrl);
    
    if (!response.ok) {
      return rules; // No robots.txt, allow all
    }
    
    const text = await response.text();
    const lines = text.split('\n').map(l => l.trim());
    
    const disallowRules: string[] = [];
    const allowRules: string[] = [];
    let crawlDelay: number | undefined;
    const sitemaps: string[] = [];
    let currentUserAgent = false;
    
    for (const line of lines) {
      if (line.startsWith('#') || line === '') continue;
      
      const [key, ...valueParts] = line.split(':');
      const value = valueParts.join(':').trim();
      const lowerKey = key.toLowerCase().trim();
      
      if (lowerKey === 'user-agent') {
        currentUserAgent = value === '*' || value.toLowerCase() === userAgent.toLowerCase();
      } else if (currentUserAgent) {
        if (lowerKey === 'disallow') {
          if (value) disallowRules.push(value);
        } else if (lowerKey === 'allow') {
          if (value) allowRules.push(value);
        } else if (lowerKey === 'crawl-delay') {
          crawlDelay = parseInt(value) * 1000; // Convert to ms
        }
      }
      
      if (lowerKey === 'sitemap') {
        sitemaps.push(value);
      }
    }
    
    // Create isAllowed function
    rules.isAllowed = (url: string) => {
      try {
        const urlObj = new URL(url);
        const path = urlObj.pathname + urlObj.search;
        
        // Check allow rules first (they take precedence)
        for (const rule of allowRules) {
          if (matchesPattern(path, rule)) {
            return true;
          }
        }
        
        // Check disallow rules
        for (const rule of disallowRules) {
          if (matchesPattern(path, rule)) {
            return false;
          }
        }
        
        return true;
      } catch {
        return true;
      }
    };
    
    rules.crawlDelay = crawlDelay;
    rules.sitemaps = sitemaps;
    
  } catch (error) {
    console.error('Error parsing robots.txt:', error);
  }
  
  return rules;
}

function matchesPattern(path: string, pattern: string): boolean {
  // Convert robots.txt pattern to regex
  // * matches any sequence, $ matches end of URL
  let regexPattern = pattern
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape special chars
    .replace(/\*/g, '.*'); // * -> .*
  
  if (regexPattern.endsWith('$')) {
    regexPattern = '^' + regexPattern;
  } else {
    regexPattern = '^' + regexPattern;
  }
  
  try {
    return new RegExp(regexPattern).test(path);
  } catch {
    return false;
  }
}
