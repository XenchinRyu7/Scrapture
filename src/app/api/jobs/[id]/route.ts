import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  const job = await prisma.crawlJob.findUnique({
    where: { id },
    include: {
      results: true,
      logs: {
        orderBy: { timestamp: 'asc' },
      },
      domainConfig: true,
    },
  });

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  return NextResponse.json(job);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.crawlJob.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
