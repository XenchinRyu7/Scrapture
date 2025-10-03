import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const [total, running, completed] = await Promise.all([
      prisma.crawlSession.count(),
      prisma.crawlSession.count({ where: { status: 'running' } }),
      prisma.crawlSession.count({ where: { status: 'completed' } }),
    ]);

    return NextResponse.json({
      total,
      running,
      completed,
    });
  } catch (error: unknown) {
    console.error('Failed to fetch session stats:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
