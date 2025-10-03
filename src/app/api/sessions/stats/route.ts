import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
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
  } catch (error: any) {
    console.error('Failed to fetch session stats:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
