import { chromium, Browser, Page } from 'playwright';
import { prisma } from './db';
import { normalizeUrl, isNonHtmlResource, isSameDomain, hashContent } from './url-normalizer';
import { parseRobotsTxt, RobotsRules } from './robots-parser';
import { parseSitemap, discoverSitemaps } from './sitemap-parser';
import { parseHTML, extractJSONLD, extractMetadata } from './html-parser';
import crypto from 'crypto';

export interface CrawlSessionConfig {
  seedUrl: string;
  maxDepth?: number;
  maxPages?: number;
  sameDomainOnly?: boolean;
  followSitemap?: boolean;
  respectRobots?: boolean;
  domainConfigId?: string;
  screenshot?: boolean;
  captureApiResponses?: boolean;
  autoScroll?: boolean;
}

export class AdvancedCrawler {
  private browser: Browser | null = null;
  private sessionId: string;
  private config: Required<CrawlSessionConfig>;
  private robotsRules: RobotsRules | null = null;
  private visitedHashes: Set<string> = new Set();
  private rateLimiters: Map<string, number> = new Map();

  constructor(sessionId: string, config: CrawlSessionConfig) {
    this.sessionId = sessionId;
    this.config = {
      ...config,
      maxDepth: config.maxDepth ?? 3,
      maxPages: config.maxPages ?? 100,
      sameDomainOnly: config.sameDomainOnly ?? true,
      followSitemap: config.followSitemap ?? true,
      respectRobots: config.respectRobots ?? true,
      screenshot: config.screenshot ?? true,
      captureApiResponses: config.captureApiResponses ?? true,
      autoScroll: config.autoScroll ?? true,
      domainConfigId: config.domainConfigId ?? '',
    };
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
      });
    }

    // Parse robots.txt
    if (this.config.respectRobots) {
      this.robotsRules = await parseRobotsTxt(this.config.seedUrl);
      await this.logMessage('info', `Robots.txt parsed. Crawl delay: ${this.robotsRules.crawlDelay || 'none'}`);
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async startCrawl() {
    await this.initialize();
    await this.logMessage('info', 'Starting advanced crawl session');

    try {
      // Step 1: Discover sitemaps
      const sitemapUrls: string[] = [];
      if (this.config.followSitemap) {
        await this.logMessage('info', 'Discovering sitemaps...');
        const discovered = await discoverSitemaps(this.config.seedUrl);
        sitemapUrls.push(...discovered);
        
        if (this.robotsRules?.sitemaps) {
          sitemapUrls.push(...this.robotsRules.sitemaps);
        }
        
        await this.logMessage('info', `Found ${sitemapUrls.length} sitemap(s)`);
      }

      // Step 2: Parse sitemaps and enqueue URLs
      const sitemapDiscovered: Set<string> = new Set();
      for (const sitemapUrl of sitemapUrls) {
        const urls = await parseSitemap(sitemapUrl);
        urls.forEach(url => sitemapDiscovered.add(url));
        await this.logMessage('info', `Parsed sitemap: ${sitemapUrl} (${urls.length} URLs)`);
      }

      // Step 3: Enqueue seed URL and sitemap URLs
      await this.enqueueUrl(this.config.seedUrl, 0, null);
      
      for (const url of sitemapDiscovered) {
        await this.enqueueUrl(url, 1, this.config.seedUrl);
      }

      // Step 4: Process frontier
      await this.processFrontier();

      await this.logMessage('info', 'Crawl session completed');
      
      await prisma.crawlSession.update({
        where: { id: this.sessionId },
        data: { status: 'completed', completedAt: new Date() },
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      await this.logMessage('error', `Crawl session failed: ${errorMessage}`);
      await prisma.crawlSession.update({
        where: { id: this.sessionId },
        data: { status: 'failed' },
      });
    } finally {
      await this.close();
    }
  }

  private async processFrontier() {
    let crawledCount = 0;
    const maxPages = this.config.maxPages;

    while (crawledCount < maxPages) {
      // Get next URL from frontier
      const nextUrl = await prisma.discoveredUrl.findFirst({
        where: {
          sessionId: this.sessionId,
          status: 'queued',
        },
        orderBy: [
          { depth: 'asc' },
        ],
      });

      if (!nextUrl) {
        await this.logMessage('info', 'Frontier exhausted');
        break;
      }

      // Check depth limit
      if (nextUrl.depth > this.config.maxDepth) {
        await prisma.discoveredUrl.update({
          where: { id: nextUrl.id },
          data: { status: 'skipped', error: 'Max depth exceeded' },
        });
        continue;
      }

      // Check robots.txt
      if (this.robotsRules && !this.robotsRules.isAllowed(nextUrl.url)) {
        await prisma.discoveredUrl.update({
          where: { id: nextUrl.id },
          data: { status: 'skipped', error: 'Blocked by robots.txt' },
        });
        await this.logMessage('info', `Skipped (robots.txt): ${nextUrl.url}`);
        continue;
      }

      // Apply rate limiting
      await this.applyRateLimit(nextUrl.url);

      // Mark as running
      await prisma.discoveredUrl.update({
        where: { id: nextUrl.id },
        data: { status: 'running' },
      });

      // Crawl the page
      try {
        await this.crawlPage(nextUrl.url, nextUrl.depth);
        crawledCount++;
        
        await prisma.discoveredUrl.update({
          where: { id: nextUrl.id },
          data: { 
            status: 'completed',
            crawledAt: new Date(),
          },
        });

        await this.logMessage('info', `Crawled [${crawledCount}/${maxPages}]: ${nextUrl.url}`);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        await prisma.discoveredUrl.update({
          where: { id: nextUrl.id },
          data: { 
            status: 'failed',
            error: errorMessage,
          },
        });
        await this.logMessage('error', `Failed to crawl: ${nextUrl.url} - ${errorMessage}`);
      }
    }
  }

  private async crawlPage(url: string, depth: number) {
    const page = await this.browser!.newPage();

    try {
      const apiResponses: Array<{
        url: string;
        method: string;
        status: number;
        body: unknown;
      }> = [];

      // Capture API responses
      if (this.config.captureApiResponses) {
        page.on('response', async (response) => {
          const respUrl = response.url();
          const isJson = response.headers()['content-type']?.includes('application/json');
          
          if (isJson && (respUrl.includes('/api/') || respUrl.includes('/graphql'))) {
            try {
              const body = await response.json();
              apiResponses.push({
                url: respUrl,
                method: response.request().method(),
                status: response.status(),
                body,
              });
            } catch {
              // Silent fail
            }
          }
        });
      }

      // Intercept SPA navigation (pushState)
      await page.addInitScript(() => {
        const pushState = history.pushState;
        const replaceState = history.replaceState;
        
        (window as unknown as { __spaUrls: string[] }).__spaUrls = [];
        
        history.pushState = function(...args) {
          const url = args[2];
          if (url) (window as unknown as { __spaUrls: string[] }).__spaUrls.push(String(url));
          return pushState.apply(history, args);
        };
        
        history.replaceState = function(...args) {
          const url = args[2];
          if (url) (window as unknown as { __spaUrls: string[] }).__spaUrls.push(String(url));
          return replaceState.apply(history, args);
        };
      });

      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      if (this.config.autoScroll) {
        await this.autoScroll(page);
      }

      // Extract all links
      const links = await page.$$eval('a[href]', (elements) => 
        elements.map((el) => (el as HTMLAnchorElement).href).filter(href => href)
      );

      // Extract canonical URL
      const canonical = await page.$eval('link[rel="canonical"]', el => (el as HTMLLinkElement).href).catch(() => null);

      // Get SPA URLs
      const spaUrls = await page.evaluate(() => (window as unknown as { __spaUrls: string[] }).__spaUrls || []);

      // Get HTML content
      const htmlContent = await page.content();
      const contentHash = hashContent(htmlContent);

      // Check for duplicate content
      if (this.visitedHashes.has(contentHash)) {
        await this.logMessage('info', `Duplicate content detected: ${url}`);
        return;
      }
      this.visitedHashes.add(contentHash);

      // Parse HTML and extract structured data
      const parsedHTML = parseHTML(htmlContent, url);
      const jsonLD = extractJSONLD(htmlContent);
      const metadata = extractMetadata(htmlContent);

      await this.logMessage('info', `Extracted: ${parsedHTML.links.length} links, ${jsonLD.length} JSON-LD, ${parsedHTML.wordCount} words`);

      // Take screenshot
      let screenshotPath: string | undefined;
      if (this.config.screenshot) {
        const filename = `${this.sessionId}-${crypto.randomBytes(8).toString('hex')}.png`;
        screenshotPath = `screenshots/${filename}`;
        await page.screenshot({ 
          path: `public/${screenshotPath}`,
          fullPage: true 
        });
      }

      // Save to database
      const job = await prisma.crawlJob.create({
        data: {
          sessionId: this.sessionId,
          url,
          status: 'completed',
          depth,
          startedAt: new Date(),
          completedAt: new Date(),
        },
      });

      await prisma.crawlResult.create({
        data: {
          jobId: job.id,
          url,
          htmlContent,
          screenshotPath,
          apiResponses: apiResponses.length > 0 ? JSON.stringify(apiResponses) : null,
          structuredData: jsonLD.length > 0 ? JSON.stringify(jsonLD) : null,
          metadata: JSON.stringify(metadata),
          extractedText: parsedHTML.bodyText,
          contentHash,
        },
      });

      // Update discovered URL with content hash
      const normalized = normalizeUrl(url);
      await prisma.discoveredUrl.updateMany({
        where: {
          sessionId: this.sessionId,
          normalizedUrl: normalized.normalized,
        },
        data: {
          contentHash,
          canonicalUrl: canonical || undefined,
        },
      });

      // Enqueue discovered links
      const allLinks = [...new Set([...links, ...spaUrls])];
      for (const link of allLinks) {
        await this.enqueueUrl(link, depth + 1, url);
      }

      // Enqueue canonical if different
      if (canonical && canonical !== url) {
        await this.enqueueUrl(canonical, depth, url);
      }

    } finally {
      await page.close();
    }
  }

  private async enqueueUrl(url: string, depth: number, parentUrl: string | null) {
    try {
      // Filter non-HTML resources
      if (isNonHtmlResource(url)) {
        return;
      }

      // Normalize URL
      const normalized = normalizeUrl(url, this.config.seedUrl);
      if (!normalized.isValid) {
        return;
      }

      // Check same domain policy
      if (this.config.sameDomainOnly && !isSameDomain(normalized.normalized, this.config.seedUrl)) {
        return;
      }

      // Check if already discovered
      const existing = await prisma.discoveredUrl.findUnique({
        where: {
          sessionId_normalizedUrl: {
            sessionId: this.sessionId,
            normalizedUrl: normalized.normalized,
          },
        },
      });

      if (existing) {
        return; // Already discovered
      }

      // Add to frontier
      await prisma.discoveredUrl.create({
        data: {
          sessionId: this.sessionId,
          url: normalized.original,
          normalizedUrl: normalized.normalized,
          status: 'queued',
          depth,
          parentUrl,
        },
      });

    } catch (error: unknown) {
      // Silent fail for enqueue errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Enqueue error:', errorMessage);
    }
  }

  private async applyRateLimit(url: string) {
    const domain = new URL(url).hostname;
    const now = Date.now();
    const lastRequest = this.rateLimiters.get(domain) || 0;
    
    const delay = this.robotsRules?.crawlDelay || 1000;
    const waitTime = Math.max(0, delay - (now - lastRequest));
    
    if (waitTime > 0) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.rateLimiters.set(domain, Date.now());
  }

  private async autoScroll(page: Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  private async logMessage(level: string, message: string) {
    console.log(`[${level.toUpperCase()}] ${message}`);
    
    // Also log to session
    try {
      const job = await prisma.crawlJob.findFirst({
        where: { sessionId: this.sessionId },
        orderBy: { createdAt: 'desc' },
      });

      if (job) {
        await prisma.crawlLog.create({
          data: {
            jobId: job.id,
            level,
            message,
          },
        });
      }
    } catch {
      // Silent fail
    }
  }
}
