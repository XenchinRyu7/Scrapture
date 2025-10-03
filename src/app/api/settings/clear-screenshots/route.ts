import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots');
    
    console.log('🖼️ Clearing screenshots...');
    console.log(`   Directory: ${screenshotsDir}`);
    
    // Check if directory exists
    try {
      await fs.access(screenshotsDir);
    } catch {
      // Directory doesn't exist, nothing to clear
      console.log('   Directory does not exist');
      return NextResponse.json({
        message: 'Screenshots directory does not exist',
        count: 0,
      });
    }
    
    // Read all files
    const files = await fs.readdir(screenshotsDir);
    console.log(`   Found ${files.length} files`);
    
    let deletedCount = 0;
    
    // Delete each file
    for (const file of files) {
      if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.jpeg')) {
        const filePath = path.join(screenshotsDir, file);
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    console.log(`   Deleted ${deletedCount} screenshots`);
    console.log('✅ Screenshots cleared successfully!');

    return NextResponse.json({
      message: 'Screenshots cleared successfully',
      count: deletedCount,
    });
  } catch (error: any) {
    console.error('❌ Clear screenshots error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
