import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enqueueCrawl } from '@/lib/queue';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const sessionId = searchParams.get('sessionId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const includeLogs = searchParams.get('includeLogs') === 'true';
  const includeResults = searchParams.get('includeResults') === 'true';
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== 'all') where.status = status;
  if (sessionId && sessionId !== 'all') where.sessionId = sessionId;

  const [jobs, total] = await Promise.all([
    prisma.crawlJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        domainConfig: true,
        logs: includeLogs ? { orderBy: { timestamp: 'asc' } } : false,
        results: includeResults,
        _count: {
          select: {
            results: true,
            logs: true,
          },
        },
      },
    }),
    prisma.crawlJob.count({ where }),
  ]);

  return NextResponse.json({
    jobs,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      url, 
      priority, 
      domainConfigId, 
      screenshot, 
      captureApiResponses, 
      autoScroll,
      maxPages,
      followLinks,
      linkSelector,
      sameDomainOnly,
    } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const jobId = await enqueueCrawl({
      url,
      priority,
      domainConfigId,
      screenshot: screenshot !== false,
      captureApiResponses: captureApiResponses !== false,
      autoScroll: autoScroll !== false,
      maxPages: maxPages || 1,
      followLinks: followLinks || false,
      linkSelector: linkSelector || 'a[href]',
      sameDomainOnly: sameDomainOnly !== false,
    });

    const job = await prisma.crawlJob.findUnique({
      where: { id: jobId },
    });

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
