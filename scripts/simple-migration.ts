import { getAdminDb } from '../src/firebase/admin';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

async function simpleMigration() {
  console.log('🔍 Checking Firestore content for media to migrate...');
  
  try {
    const db = getAdminDb();
    const contentSnapshot = await db.collection('portfolio_content').get();
    
    let totalMediaFiles = 0;
    let supabaseUrls = 0;
    let cloudinaryUrls = 0;
    
    for (const doc of contentSnapshot.docs) {
      const content = doc.data();
      if (content.media && Array.isArray(content.media)) {
        totalMediaFiles += content.media.length;
        
        for (const media of content.media) {
          if (media.url) {
            if (media.url.includes('supabase.co')) {
              supabaseUrls++;
              console.log(`📄 Supabase URL found: ${media.url}`);
            } else if (media.url.includes('cloudinary.com')) {
              cloudinaryUrls++;
              console.log(`☁️ Cloudinary URL found: ${media.url}`);
            } else {
              console.log(`🔗 Other URL: ${media.url}`);
            }
          }
        }
      }
    }
    
    console.log(`\n📊 Migration Status:`);
    console.log(`   Total media files: ${totalMediaFiles}`);
    console.log(`   Supabase URLs: ${supabaseUrls}`);
    console.log(`   Cloudinary URLs: ${cloudinaryUrls}`);
    
    if (supabaseUrls === 0) {
      console.log(`\n✅ No Supabase URLs found - migration complete!`);
      console.log(`   All files are already on Cloudinary or no media exists.`);
    } else if (cloudinaryUrls > 0) {
      console.log(`\n⚠️ Mixed storage detected:`);
      console.log(`   Some files are on Cloudinary, some on Supabase`);
      console.log(`   Consider running full migration to consolidate`);
    } else {
      console.log(`\n🔄 Migration needed:`);
      console.log(`   Found ${supabaseUrls} files on Supabase to migrate`);
      console.log(`   Run: npx tsx scripts/migrate-storage.ts`);
    }
    
  } catch (error) {
    console.error('❌ Error checking content:', error);
  }
}

// Run if called directly
if (require.main === module) {
  simpleMigration();
}

export { simpleMigration };
