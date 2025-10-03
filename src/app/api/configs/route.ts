import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  const configs = await prisma.domainConfig.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json(configs);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      domain,
      rateLimit,
      concurrency,
      delay,
      userAgent,
      headers,
      selectors,
      enableAI,
      aiPrompt,
    } = body;

    if (!domain) {
      return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    }

    const config = await prisma.domainConfig.create({
      data: {
        domain,
        rateLimit: rateLimit || 1000,
        concurrency: concurrency || 1,
        delay: delay || 1000,
        userAgent,
        headers: headers ? JSON.stringify(headers) : null,
        selectors: selectors ? JSON.stringify(selectors) : null,
        enableAI: enableAI || false,
        aiPrompt,
      },
    });

    return NextResponse.json(config);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
