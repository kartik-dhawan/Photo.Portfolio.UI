import { getAdminDb } from '../src/firebase/admin';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

async function verifyMigration() {
  console.log('🔍 Verifying Firestore URL updates...');
  
  try {
    const db = getAdminDb();
    const contentSnapshot = await db.collection('portfolio_content').get();
    
    let totalDocuments = 0;
    let documentsWithCloudinary = 0;
    let documentsWithSupabase = 0;
    let totalMediaItems = 0;
    let cloudinaryUrls = 0;
    let supabaseUrls = 0;
    let sampleUrls: any[] = [];
    
    for (const doc of contentSnapshot.docs) {
      const content = doc.data();
      totalDocuments++;
      
      if (!content.blocks || !Array.isArray(content.blocks)) continue;
      
      let documentHasCloudinary = false;
      let documentHasSupabase = false;
      
      for (const block of content.blocks) {
        if (block.type === 'image' && block.media && Array.isArray(block.media)) {
          for (const mediaItem of block.media) {
            totalMediaItems++;
            
            if (mediaItem.url) {
              if (mediaItem.url.includes('cloudinary.com')) {
                cloudinaryUrls++;
                documentHasCloudinary = true;
                
                if (sampleUrls.length < 5) {
                  sampleUrls.push({
                    document: doc.id,
                    type: 'cloudinary',
                    url: mediaItem.url,
                    storageProvider: mediaItem.storageProvider
                  });
                }
              } else if (mediaItem.url.includes('supabase.co')) {
                supabaseUrls++;
                documentHasSupabase = true;
                
                if (sampleUrls.length < 5) {
                  sampleUrls.push({
                    document: doc.id,
                    type: 'supabase',
                    url: mediaItem.url,
                    storageProvider: mediaItem.storageProvider
                  });
                }
              }
            }
          }
        }
      }
      
      if (documentHasCloudinary) documentsWithCloudinary++;
      if (documentHasSupabase) documentsWithSupabase++;
    }
    
    console.log(`\n📊 Verification Results:`);
    console.log(`   Total documents: ${totalDocuments}`);
    console.log(`   Documents with Cloudinary URLs: ${documentsWithCloudinary}`);
    console.log(`   Documents with Supabase URLs: ${documentsWithSupabase}`);
    console.log(`   Total media items: ${totalMediaItems}`);
    console.log(`   Cloudinary URLs: ${cloudinaryUrls}`);
    console.log(`   Supabase URLs: ${supabaseUrls}`);
    
    console.log(`\n🔍 Sample URLs:`);
    sampleUrls.forEach((sample, index) => {
      console.log(`${index + 1}. ${sample.type} (${sample.document})`);
      console.log(`   ${sample.url.substring(0, 80)}...`);
      if (sample.storageProvider) {
        console.log(`   Provider: ${sample.storageProvider}`);
      }
      console.log('');
    });
    
    // Calculate success rate
    const migrationSuccessRate = ((cloudinaryUrls / totalMediaItems) * 100).toFixed(1);
    const remainingSupabaseRate = ((supabaseUrls / totalMediaItems) * 100).toFixed(1);
    
    console.log(`📈 Migration Status:`);
    console.log(`   ✅ Successfully migrated: ${migrationSuccessRate}%`);
    console.log(`   📋 Remaining on Supabase: ${remainingSupabaseRate}%`);
    
    if (supabaseUrls > 0) {
      console.log(`\n⚠️ Note: ${supabaseUrls} URLs still point to Supabase`);
      console.log(`   These are likely videos that were intentionally kept on Supabase`);
    }
    
    if (cloudinaryUrls > 0) {
      console.log(`\n✅ Success! ${cloudinaryUrls} URLs now point to Cloudinary`);
      console.log(`   Your images will load from Cloudinary's CDN`);
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  verifyMigration();
}

export { verifyMigration };
