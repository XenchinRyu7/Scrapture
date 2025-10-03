import { startWorker } from './src/lib/queue';

console.log('Starting Scrapture worker...');

const worker = startWorker();

process.on('SIGTERM', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await worker.close();
  process.exit(0);
});

console.log('Worker started successfully. Waiting for jobs...');
