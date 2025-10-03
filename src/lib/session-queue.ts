import { Queue, Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { prisma } from './db';
import { AdvancedCrawler, CrawlSessionConfig } from './advanced-crawler';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export const sessionQueue = new Queue('crawl-sessions', { connection });

export async function enqueueSession(config: CrawlSessionConfig): Promise<string> {
  const session = await prisma.crawlSession.create({
    data: {
      seedUrl: config.seedUrl,
      maxDepth: config.maxDepth || 3,
      maxPages: config.maxPages || 100,
      sameDomainOnly: config.sameDomainOnly !== false,
      followSitemap: config.followSitemap !== false,
      domainConfigId: config.domainConfigId,
      status: 'queued',
    },
  });

  await sessionQueue.add('crawl-session', {
    sessionId: session.id,
    config,
  }, {
    attempts: 1, // Don't retry full sessions
  });

  return session.id;
}

export function startSessionWorker() {
  const worker = new Worker('crawl-sessions', async (job: Job) => {
    const { sessionId, config } = job.data;

    await prisma.crawlSession.update({
      where: { id: sessionId },
      data: { status: 'running', startedAt: new Date() },
    });

    const crawler = new AdvancedCrawler(sessionId, config);
    await crawler.startCrawl();

  }, { connection, concurrency: 1 }); // Process one session at a time

  worker.on('completed', (job) => {
    console.log(`Session ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Session ${job?.id} failed:`, err);
  });

  return worker;
}
