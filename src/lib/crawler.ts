import { chromium, Browser, Page } from 'playwright';
import { CrawlConfig, CrawlData, CrawlerOptions } from '@/types';

export class Crawler {
  private browser: Browser | null = null;
  private options: CrawlerOptions;

  constructor(options: CrawlerOptions = {}) {
    this.options = options;
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async crawl(config: CrawlConfig): Promise<CrawlData> {
    await this.initialize();
    
    if (config.followLinks && config.maxPages && config.maxPages > 1) {
      return await this.crawlMultiPage(config);
    }
    
    return await this.crawlSinglePage(config);
  }

  private async crawlSinglePage(config: CrawlConfig): Promise<CrawlData> {
    const page = await this.browser!.newPage({
      userAgent: this.options.userAgent,
      extraHTTPHeaders: this.options.headers,
    });

    const apiResponses: Array<{
      url: string;
      method: string;
      status: number;
      body: unknown;
    }> = [];

    if (config.captureApiResponses) {
      page.on('response', async (response) => {
        const url = response.url();
        const isJson = response.headers()['content-type']?.includes('application/json');
        
        if (isJson && (url.includes('/api/') || url.includes('/graphql'))) {
          try {
            const body = await response.json();
            apiResponses.push({
              url,
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

    await page.goto(config.url, { waitUntil: 'networkidle' });

    if (config.waitForSelector) {
      await page.waitForSelector(config.waitForSelector, { timeout: 10000 });
    }

    if (config.autoScroll) {
      await this.autoScroll(page, config.maxScrolls || 10);
    }

    await new Promise(resolve => setTimeout(resolve, this.options.delay || 1000));

    const htmlContent = await page.content();
    
    let jsonData: Record<string, unknown> | undefined;
    if (this.options.selectors) {
      jsonData = {};
      for (const [key, selector] of Object.entries(this.options.selectors)) {
        try {
          const element = await page.$(selector);
          if (element) {
            jsonData[key] = await element.textContent();
          }
        } catch {
          // Silent fail
        }
      }
    }

    let screenshot: Buffer | undefined;
    if (config.screenshot) {
      screenshot = await page.screenshot({ fullPage: true });
    }

    await page.close();

    return {
      htmlContent,
      jsonData,
      screenshot,
      apiResponses: apiResponses.length > 0 ? apiResponses : undefined,
    };
  }

  private async crawlMultiPage(config: CrawlConfig): Promise<CrawlData> {
    const visited = new Set<string>();
    const queue: string[] = [config.url];
    const allData: Array<{ url: string; html: string; data?: Record<string, unknown> }> = [];
    const allApiResponses: Array<{
      url: string;
      method: string;
      status: number;
      body: unknown;
    }> = [];
    const screenshots: Buffer[] = [];
    
    const maxPages = config.maxPages || 10;
    const linkSelector = config.linkSelector || 'a[href]';
    const baseDomain = new URL(config.url).hostname;

    while (queue.length > 0 && visited.size < maxPages) {
      const currentUrl = queue.shift()!;
      if (visited.has(currentUrl)) continue;
      
      visited.add(currentUrl);
      
      const page = await this.browser!.newPage({
        userAgent: this.options.userAgent,
        extraHTTPHeaders: this.options.headers,
      });

      try {
        if (config.captureApiResponses) {
          page.on('response', async (response) => {
            const url = response.url();
            const isJson = response.headers()['content-type']?.includes('application/json');
            
            if (isJson && (url.includes('/api/') || url.includes('/graphql'))) {
              try {
                const body = await response.json();
                allApiResponses.push({
                  url,
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

        await page.goto(currentUrl, { waitUntil: 'networkidle', timeout: 30000 });

        if (config.autoScroll) {
          await this.autoScroll(page, config.maxScrolls || 10);
        }

        await new Promise(resolve => setTimeout(resolve, this.options.delay || 1000));

        const htmlContent = await page.content();
        
        let jsonData: Record<string, unknown> | undefined;
        if (this.options.selectors) {
          jsonData = {};
          for (const [key, selector] of Object.entries(this.options.selectors)) {
            try {
              const elements = await page.$$(selector);
              const texts = await Promise.all(
                elements.map(el => el.textContent())
              );
              jsonData[key] = texts.filter(t => t).join(' | ');
            } catch {
              // Silent fail
            }
          }
        }

        allData.push({
          url: currentUrl,
          html: htmlContent,
          data: jsonData,
        });

        if (config.screenshot && visited.size === 1) {
          const screenshot = await page.screenshot({ fullPage: true });
          screenshots.push(screenshot);
        }

        const links = await page.$$eval(linkSelector, (elements) => 
          elements.map((el) => (el as HTMLAnchorElement).href).filter(href => href)
        );

        for (const link of links) {
          try {
            const linkUrl = new URL(link, currentUrl);
            const linkDomain = linkUrl.hostname;
            
            if (config.sameDomainOnly !== false && linkDomain !== baseDomain) {
              continue;
            }
            
            const normalizedUrl = linkUrl.origin + linkUrl.pathname;
            if (!visited.has(normalizedUrl) && !queue.includes(normalizedUrl)) {
              queue.push(normalizedUrl);
            }
          } catch {
            // Silent fail
          }
        }

      } catch (error) {
        console.error(`Failed to crawl ${currentUrl}:`, error);
      } finally {
        await page.close();
      }
    }

    return {
      htmlContent: allData.map(d => `\n=== ${d.url} ===\n${d.html}`).join('\n'),
      jsonData: {
        pages: allData,
        totalPages: visited.size,
        urls: Array.from(visited),
      },
      screenshot: screenshots[0],
      apiResponses: allApiResponses.length > 0 ? allApiResponses : undefined,
    };
  }

  private async autoScroll(page: Page, maxScrolls: number) {
    await page.evaluate(async (max) => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        let scrolls = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          scrolls++;

          if (totalHeight >= scrollHeight || scrolls >= max) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    }, maxScrolls);
  }
}
