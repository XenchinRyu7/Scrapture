import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { jobIds, status } = body;

    if (jobIds && Array.isArray(jobIds)) {
      await prisma.crawlJob.deleteMany({
        where: {
          id: { in: jobIds },
        },
      });

      return NextResponse.json({ 
        success: true, 
        deleted: jobIds.length,
        message: `Deleted ${jobIds.length} job(s)` 
      });
    }

    if (status) {
      const result = await prisma.crawlJob.deleteMany({
        where: { status },
      });

      return NextResponse.json({ 
        success: true, 
        deleted: result.count,
        message: `Deleted ${result.count} ${status} job(s)` 
      });
    }

    return NextResponse.json(
      { error: 'Either jobIds array or status is required' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
