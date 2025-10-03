import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json'; // json, csv, ndjson

    const session = await prisma.crawlSession.findUnique({
      where: { id: params.id },
      include: {
        jobs: {
          include: {
            results: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const exportData = session.jobs.flatMap(job => 
      job.results.map(result => ({
        url: result.url,
        jobId: job.id,
        status: job.status,
        depth: job.depth,
        title: result.structuredData ? JSON.parse(result.structuredData)[0]?.name || '' : '',
        structuredData: result.structuredData ? JSON.parse(result.structuredData) : null,
        metadata: result.metadata ? JSON.parse(result.metadata) : null,
        extractedText: result.extractedText,
        wordCount: result.extractedText?.split(/\s+/).length || 0,
        contentHash: result.contentHash,
        apiResponses: result.apiResponses ? JSON.parse(result.apiResponses) : null,
        screenshotPath: result.screenshotPath,
        crawledAt: result.createdAt,
      }))
    );

    if (format === 'csv') {
      const csv = convertToCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="session-${params.id}.csv"`,
        },
      });
    }

    if (format === 'ndjson') {
      const ndjson = exportData.map(item => JSON.stringify(item)).join('\n');
      return new NextResponse(ndjson, {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Content-Disposition': `attachment; filename="session-${params.id}.ndjson"`,
        },
      });
    }

    // Default: JSON
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="session-${params.id}.json"`,
      },
    });
  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = [
    'url',
    'status',
    'depth',
    'title',
    'wordCount',
    'contentHash',
    'hasStructuredData',
    'hasApiResponses',
    'screenshotPath',
    'crawledAt',
  ];

  const rows = data.map(item => [
    escapeCSV(item.url),
    escapeCSV(item.status),
    item.depth,
    escapeCSV(item.title || ''),
    item.wordCount,
    escapeCSV(item.contentHash || ''),
    item.structuredData ? 'yes' : 'no',
    item.apiResponses ? 'yes' : 'no',
    escapeCSV(item.screenshotPath || ''),
    item.crawledAt,
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
}

function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
