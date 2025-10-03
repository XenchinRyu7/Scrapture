import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { enqueueCrawl } from '@/lib/queue';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const limit = parseInt(searchParams.get('limit') || '50');
  const includeLogs = searchParams.get('includeLogs') === 'true';
  const includeResults = searchParams.get('includeResults') === 'true';

  const where = status ? { status } : {};

  const jobs = await prisma.crawlJob.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: {
      domainConfig: true,
      logs: includeLogs ? { orderBy: { timestamp: 'asc' } } : false,
      results: includeResults,
    },
  });

  return NextResponse.json(jobs);
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
