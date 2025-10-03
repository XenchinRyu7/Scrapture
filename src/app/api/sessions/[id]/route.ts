import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const session = await prisma.crawlSession.findUnique({
    where: { id },
    include: {
      domainConfig: true,
      discoveredUrls: {
        orderBy: { discoveredAt: 'desc' },
        take: 100,
      },
      jobs: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          results: {
            select: {
              structuredData: true,
              metadata: true,
              extractedText: true,
            },
          },
          logs: true,
        },
      },
      _count: {
        select: {
          discoveredUrls: true,
          jobs: true,
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Calculate stats
  const stats = await prisma.discoveredUrl.groupBy({
    by: ['status'],
    where: { sessionId: id },
    _count: true,
  });

  const depthStats = await prisma.discoveredUrl.groupBy({
    by: ['depth'],
    where: { sessionId: id },
    _count: true,
  });

  // Calculate overall stats
  let totalStructuredData = 0;
  let totalWords = 0;
  let totalMetadata = 0;
  let completedJobs = 0;

  session.jobs.forEach(job => {
    if (job.status === 'completed') completedJobs++;
    
    job.results.forEach(result => {
      if (result.structuredData) {
        try {
          const parsed = JSON.parse(result.structuredData);
          totalStructuredData += Array.isArray(parsed) ? parsed.length : 1;
        } catch {}
      }
      if (result.metadata) {
        try {
          const parsed = JSON.parse(result.metadata);
          totalMetadata += Object.keys(parsed).filter(k => parsed[k]).length;
        } catch {}
      }
      if (result.extractedText) {
        totalWords += result.extractedText.split(/\s+/).length;
      }
    });
  });

  const overallStats = {
    totalJobs: session._count.jobs,
    completedJobs,
    totalStructuredData,
    totalWords,
    totalMetadata,
  };

  return NextResponse.json({
    ...session,
    stats: {
      byStatus: stats.reduce((acc, s) => {
        acc[s.status] = s._count;
        return acc;
      }, {} as Record<string, number>),
      byDepth: depthStats.reduce((acc, d) => {
        acc[d.depth] = d._count;
        return acc;
      }, {} as Record<number, number>),
    },
    overallStats,
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.crawlSession.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
