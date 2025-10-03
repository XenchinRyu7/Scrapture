import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const [total, pending, queued, running, completed, failed] = await Promise.all([
    prisma.crawlJob.count(),
    prisma.crawlJob.count({ where: { status: 'pending' } }),
    prisma.crawlJob.count({ where: { status: 'queued' } }),
    prisma.crawlJob.count({ where: { status: 'running' } }),
    prisma.crawlJob.count({ where: { status: 'completed' } }),
    prisma.crawlJob.count({ where: { status: 'failed' } }),
  ]);

  return NextResponse.json({
    total,
    pending,
    queued,
    running,
    completed,
    failed,
  });
}
