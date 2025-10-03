import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const config = await prisma.domainConfig.findUnique({
    where: { id },
  });

  if (!config) {
    return NextResponse.json({ error: 'Config not found' }, { status: 404 });
  }

  return NextResponse.json(config);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const config = await prisma.domainConfig.update({
    where: { id },
    data: {
      ...body,
      headers: body.headers ? JSON.stringify(body.headers) : undefined,
      selectors: body.selectors ? JSON.stringify(body.selectors) : undefined,
    },
  });

  return NextResponse.json(config);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.domainConfig.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}
