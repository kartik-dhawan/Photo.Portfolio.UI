import { getAdminDb } from '../src/firebase/admin';
import { config } from 'dotenv';
import https from 'https';

// Load environment variables
config({ path: '.env' });

async function testUrls() {
  console.log('🧪 Testing migrated URLs...');
  
  try {
    const db = getAdminDb();
    const contentSnapshot = await db.collection('portfolio_content').limit(3).get();
    
    let testResults: any[] = [];
    
    for (const doc of contentSnapshot.docs) {
      const content = doc.data();
      
      if (!content.blocks || !Array.isArray(content.blocks)) continue;
      
      console.log(`\n📝 Testing: ${doc.id}`);
      
      for (const block of content.blocks) {
        if (block.type === 'image' && block.media && Array.isArray(block.media)) {
          for (const mediaItem of block.media) {
            if (mediaItem.url && testResults.length < 5) {
              const result = await testUrl(mediaItem.url);
              testResults.push({
                url: mediaItem.url,
                type: mediaItem.url.includes('cloudinary.com') ? 'cloudinary' : 'supabase',
                status: result.status,
                contentType: result.contentType,
                size: result.size
              });
              
              console.log(`  🌐 ${result.status}: ${mediaItem.url.substring(0, 80)}...`);
              console.log(`     Type: ${result.contentType}, Size: ${result.size}`);
            }
          }
        }
      }
    }
    
    console.log(`\n📊 Test Results:`);
    testResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.type}: ${result.status}`);
      console.log(`   ${result.url.substring(0, 80)}...`);
      console.log(`   Size: ${result.size}, Type: ${result.contentType}`);
    });
    
    const workingUrls = testResults.filter(r => r.status === '200 OK').length;
    console.log(`\n✅ Working URLs: ${workingUrls}/${testResults.length}`);
    
    if (workingUrls === testResults.length) {
      console.log(`🎉 All URLs are working correctly!`);
    }
    
  } catch (error) {
    console.error('❌ URL testing failed:', error);
  }
}

async function testUrl(url: string): Promise<{ status: string; contentType: string; size: string }> {
  return new Promise((resolve) => {
    const req = https.request(url, { method: 'HEAD', timeout: 5000 }, (res) => {
      resolve({
        status: `${res.statusCode} ${res.statusMessage}`,
        contentType: res.headers['content-type'] || 'unknown',
        size: res.headers['content-length'] ? `${Math.round(parseInt(res.headers['content-length']) / 1024)} KB` : 'unknown'
      });
    });
    
    req.on('error', () => {
      resolve({ status: 'ERROR', contentType: 'unknown', size: 'unknown' });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ status: 'TIMEOUT', contentType: 'unknown', size: 'unknown' });
    });
    
    req.end();
  });
}

// Run if called directly
if (require.main === module) {
  testUrls();
}

export { testUrls };
