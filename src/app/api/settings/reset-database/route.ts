import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST() {
  try {
    // WARNING: This deletes ALL data!
    // Delete in order to respect foreign key constraints
    
    console.log('🗑️ Starting database reset...');
    
    // 1. Delete CrawlResults (depends on CrawlJob)
    const deletedResults = await prisma.crawlResult.deleteMany({});
    console.log(`   Deleted ${deletedResults.count} crawl results`);
    
    // 2. Delete CrawlLogs (depends on CrawlJob)
    const deletedLogs = await prisma.crawlLog.deleteMany({});
    console.log(`   Deleted ${deletedLogs.count} crawl logs`);
    
    // 3. Delete CrawlJobs (depends on CrawlSession and DomainConfig)
    const deletedJobs = await prisma.crawlJob.deleteMany({});
    console.log(`   Deleted ${deletedJobs.count} crawl jobs`);
    
    // 4. Delete DiscoveredUrls (depends on CrawlSession)
    const deletedUrls = await prisma.discoveredUrl.deleteMany({});
    console.log(`   Deleted ${deletedUrls.count} discovered URLs`);
    
    // 5. Delete CrawlSessions
    const deletedSessions = await prisma.crawlSession.deleteMany({});
    console.log(`   Deleted ${deletedSessions.count} crawl sessions`);
    
    // 6. Delete DomainConfigs (independent)
    const deletedConfigs = await prisma.domainConfig.deleteMany({});
    console.log(`   Deleted ${deletedConfigs.count} domain configs`);
    
    console.log('✅ Database reset complete!');

    return NextResponse.json({
      message: 'Database reset successfully',
      deleted: {
        results: deletedResults.count,
        logs: deletedLogs.count,
        jobs: deletedJobs.count,
        urls: deletedUrls.count,
        sessions: deletedSessions.count,
        configs: deletedConfigs.count,
      },
    });
  } catch (error: unknown) {
    console.error('❌ Database reset error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
