import { NextResponse } from 'next/server';
import Redis from 'ioredis';

export async function POST() {
  try {
    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    
    console.log('🧹 Clearing Redis cache...');
    
    // Get all keys
    const keys = await redis.keys('*');
    console.log(`   Found ${keys.length} keys`);
    
    if (keys.length > 0) {
      // Delete all keys
      await redis.del(...keys);
      console.log(`   Deleted ${keys.length} keys`);
    }
    
    await redis.quit();
    
    console.log('✅ Cache cleared successfully!');

    return NextResponse.json({
      message: 'Cache cleared successfully',
      keysDeleted: keys.length,
    });
  } catch (error: unknown) {
    console.error('❌ Clear cache error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
