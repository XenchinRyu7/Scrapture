import { startSessionWorker } from './src/lib/session-queue';

console.log('Starting Scrapture session worker (Advanced Crawler)...');

const worker = startSessionWorker();

process.on('SIGTERM', async () => {
  console.log('Shutting down session worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down session worker...');
  await worker.close();
  process.exit(0);
});

console.log('Session worker started. Ready to crawl entire websites!');
