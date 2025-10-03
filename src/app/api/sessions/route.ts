import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enqueueSession } from '@/lib/session-queue';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '50');

  const sessions = await prisma.crawlSession.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      domainConfig: true,
      _count: {
        select: {
          discoveredUrls: true,
          jobs: true,
        },
      },
    },
  });

  return NextResponse.json(sessions);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      seedUrl,
      maxDepth,
      maxPages,
      sameDomainOnly,
      followSitemap,
      respectRobots,
      domainConfigId,
      screenshot,
      captureApiResponses,
      autoScroll,
    } = body;

    if (!seedUrl) {
      return NextResponse.json({ error: 'Seed URL is required' }, { status: 400 });
    }

    const sessionId = await enqueueSession({
      seedUrl,
      maxDepth: maxDepth || 3,
      maxPages: maxPages || 100,
      sameDomainOnly: sameDomainOnly !== false,
      followSitemap: followSitemap !== false,
      respectRobots: respectRobots !== false,
      domainConfigId,
      screenshot: screenshot !== false,
      captureApiResponses: captureApiResponses !== false,
      autoScroll: autoScroll !== false,
    });

    const session = await prisma.crawlSession.findUnique({
      where: { id: sessionId },
    });

    return NextResponse.json(session);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
