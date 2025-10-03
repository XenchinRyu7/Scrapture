import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;
    
    const where: any = {};
    
    // Filter by session if provided
    if (sessionId && sessionId !== 'all') {
      where.job = {
        sessionId,
      };
    }
    
    const [results, total] = await Promise.all([
      prisma.crawlResult.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          job: {
            select: {
              id: true,
              sessionId: true,
              status: true,
            },
          },
        },
      }),
      prisma.crawlResult.count({ where }),
    ]);

    return NextResponse.json({
      results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Failed to fetch results:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
