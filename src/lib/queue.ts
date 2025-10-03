import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { CrawlConfig } from '@/types';
import { prisma } from './db';
import { Crawler } from './crawler';
import path from 'path';
import fs from 'fs/promises';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const crawlQueue = new Queue('crawl-jobs', { connection });

export async function enqueueCrawl(config: CrawlConfig): Promise<string> {
  const job = await prisma.crawlJob.create({
    data: {
      url: config.url,
      status: 'queued',
      priority: config.priority || 1,
      domainConfigId: config.domainConfigId,
    },
  });

  await crawlQueue.add('crawl', {
    jobId: job.id,
    config,
  }, {
    priority: config.priority || 1,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  });

  return job.id;
}

async function logMessage(jobId: string, level: string, message: string) {
  await prisma.crawlLog.create({
    data: {
      jobId,
      level,
      message,
    },
  });
}

export function startWorker() {
  const worker = new Worker('crawl-jobs', async (job: Job) => {
    const { jobId, config } = job.data;

    await prisma.crawlJob.update({
      where: { id: jobId },
      data: { status: 'running', startedAt: new Date() },
    });

    await logMessage(jobId, 'info', `Starting crawl for ${config.url}`);

    try {
      let domainConfig = null;
      if (config.domainConfigId) {
        domainConfig = await prisma.domainConfig.findUnique({
          where: { id: config.domainConfigId },
        });
      }

      const crawlerOptions: any = {};
      if (domainConfig) {
        crawlerOptions.delay = domainConfig.delay;
        crawlerOptions.userAgent = domainConfig.userAgent || undefined;
        crawlerOptions.headers = domainConfig.headers ? JSON.parse(domainConfig.headers) : undefined;
        crawlerOptions.selectors = domainConfig.selectors ? JSON.parse(domainConfig.selectors) : undefined;
        crawlerOptions.enableAI = domainConfig.enableAI;
        crawlerOptions.aiPrompt = domainConfig.aiPrompt || undefined;
      }

      const crawler = new Crawler(crawlerOptions);
      const data = await crawler.crawl(config);
      await crawler.close();

      let screenshotPath: string | undefined;
      if (data.screenshot) {
        const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
        await fs.mkdir(screenshotsDir, { recursive: true });
        screenshotPath = `screenshots/${jobId}.png`;
        await fs.writeFile(
          path.join(process.cwd(), 'public', screenshotPath),
          data.screenshot
        );
      }

      let jsonData: any = data.jsonData;
      
      if (domainConfig?.enableAI && data.htmlContent) {
        await logMessage(jobId, 'info', 'Running AI extraction...');
        try {
          const aiData = await extractWithOllama(
            data.htmlContent,
            domainConfig.aiPrompt || 'Extract main content from this HTML'
          );
          jsonData = { ...jsonData, aiExtracted: aiData };
        } catch (aiError: any) {
          await logMessage(jobId, 'warn', `AI extraction failed: ${aiError.message}`);
        }
      }

      await prisma.crawlResult.create({
        data: {
          jobId,
          url: config.url,
          htmlContent: data.htmlContent,
          jsonData: jsonData ? JSON.stringify(jsonData) : null,
          screenshotPath,
          apiResponses: data.apiResponses ? JSON.stringify(data.apiResponses) : null,
        },
      });

      await prisma.crawlJob.update({
        where: { id: jobId },
        data: { 
          status: 'completed',
          completedAt: new Date(),
        },
      });

      await logMessage(jobId, 'info', `Crawl completed successfully`);

    } catch (error: any) {
      await prisma.crawlJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          error: error.message,
          completedAt: new Date(),
        },
      });

      await logMessage(jobId, 'error', `Crawl failed: ${error.message}`);
      throw error;
    }
  }, { connection });

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err);
  });

  return worker;
}

async function extractWithOllama(html: string, prompt: string): Promise<any> {
  const ollamaUrl = process.env.OLLAMA_API_URL || 'http://localhost:11434';
  
  const response = await fetch(`${ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'llama2',
      prompt: `${prompt}\n\nHTML:\n${html.substring(0, 5000)}`,
      stream: false,
    }),
  });

  if (!response.ok) {
    throw new Error('Ollama API request failed');
  }

  const data = await response.json();
  return data.response;
}
