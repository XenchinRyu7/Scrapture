#!/usr/bin/env node

import { program } from 'commander';
import { enqueueCrawl } from './src/lib/queue';
import { prisma } from './src/lib/db';

program
  .name('scrapture')
  .description('CLI tool for Scrapture web scraping framework')
  .version('1.0.0');

program
  .command('crawl')
  .description('Start a new crawl job')
  .argument('<url>', 'URL to crawl')
  .option('-p, --priority <number>', 'Job priority (1-10)', '5')
  .option('--no-screenshot', 'Disable screenshot capture')
  .option('--no-api', 'Disable API response capture')
  .option('--no-scroll', 'Disable auto-scroll')
  .action(async (url, options) => {
    try {
      const jobId = await enqueueCrawl({
        url,
        priority: parseInt(options.priority),
        screenshot: options.screenshot,
        captureApiResponses: options.api,
        autoScroll: options.scroll,
      });

      console.log(`✓ Job queued successfully!`);
      console.log(`  Job ID: ${jobId}`);
      console.log(`  URL: ${url}`);
      console.log(`\nView job details: http://localhost:3000/jobs/${jobId}`);
    } catch (error: any) {
      console.error('✗ Failed to queue job:', error.message);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program
  .command('status')
  .description('Show job statistics')
  .action(async () => {
    try {
      const [total, pending, queued, running, completed, failed] = await Promise.all([
        prisma.crawlJob.count(),
        prisma.crawlJob.count({ where: { status: 'pending' } }),
        prisma.crawlJob.count({ where: { status: 'queued' } }),
        prisma.crawlJob.count({ where: { status: 'running' } }),
        prisma.crawlJob.count({ where: { status: 'completed' } }),
        prisma.crawlJob.count({ where: { status: 'failed' } }),
      ]);

      console.log('\nJob Statistics:');
      console.log(`  Total:     ${total}`);
      console.log(`  Pending:   ${pending}`);
      console.log(`  Queued:    ${queued}`);
      console.log(`  Running:   ${running}`);
      console.log(`  Completed: ${completed}`);
      console.log(`  Failed:    ${failed}\n`);
    } catch (error: any) {
      console.error('✗ Failed to fetch stats:', error.message);
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  });

program.parse();
