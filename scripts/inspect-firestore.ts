import { getAdminDb } from '../src/firebase/admin';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

async function inspectFirestore() {
  console.log('🔥 Inspecting Firestore content structure...');
  
  try {
    const db = getAdminDb();
    const contentSnapshot = await db.collection('portfolio_content').get();
    
    console.log(`\n📊 Found ${contentSnapshot.size} content documents`);
    
    let documentsWithMedia = 0;
    let totalMediaItems = 0;
    let sampleContent = null;
    
    for (const doc of contentSnapshot.docs) {
      const data = doc.data();
      console.log(`\n📝 Document: ${doc.id}`);
      console.log(`   Keys: ${Object.keys(data).join(', ')}`);
      
      // Look for any field that might contain media
      for (const [key, value] of Object.entries(data)) {
        if (key.toLowerCase().includes('media') || key.toLowerCase().includes('image') || key.toLowerCase().includes('url')) {
          console.log(`   🎯 Found potential media field "${key}":`, typeof value, Array.isArray(value) ? `${value.length} items` : 'single item');
          
          if (Array.isArray(value)) {
            totalMediaItems += value.length;
            documentsWithMedia++;
            
            // Show first few items
            value.slice(0, 2).forEach((item, index) => {
              console.log(`     ${index + 1}.`, JSON.stringify(item, null, 2).substring(0, 200) + '...');
            });
          } else if (typeof value === 'string' && value.includes('http')) {
            totalMediaItems++;
            documentsWithMedia++;
            console.log(`     📎 URL: ${value.substring(0, 100)}...`);
          }
        }
      }
      
      // Show sample content structure
      if (!sampleContent && Object.keys(data).length > 0) {
        sampleContent = { id: doc.id, data };
      }
    }
    
    console.log(`\n📈 Summary:`);
    console.log(`   Documents with media: ${documentsWithMedia}`);
    console.log(`   Total media items: ${totalMediaItems}`);
    
    // Show full sample structure
    if (sampleContent) {
      console.log(`\n🔍 Sample document structure:`);
      console.log(JSON.stringify(sampleContent, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  inspectFirestore();
}

export { inspectFirestore };
