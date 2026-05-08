import { createClient } from '@supabase/supabase-js';
import { getAdminDb } from '../src/firebase/admin';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'photo-portfolio';

async function checkSupabaseStorage() {
  console.log('🔍 Checking Supabase storage contents...');

  try {
    // List all files in the bucket
    const { data: files, error } = await supabase.storage
      .from(BUCKET)
      .list('', {
        limit: 100
      });

    if (error) {
      console.error('❌ Error listing files:', error.message);
      return;
    }

    if (!files || files.length === 0) {
      console.log('📦 No files found in Supabase storage');
      return;
    }

    console.log(`📦 Found ${files.length} files/folders in Supabase storage:`);

    for (const file of files) {
      if ('id' in file && !file.id) {
        console.log(`📁 ${file.name}/`);

        // List contents of this folder
        const { data: folderContents } = await supabase.storage
          .from(BUCKET)
          .list(file.name);

        if (folderContents && folderContents.length > 0) {
          for (const item of folderContents) {
            const publicUrl = supabase.storage
              .from(BUCKET)
              .getPublicUrl(`${file.name}/${item.name}`).data.publicUrl;
            console.log(`  📄 ${item.name} (${(item as any).size || 'unknown'} bytes)`);
            console.log(`     🔗 ${publicUrl}`);
          }
        }
      } else {
        const publicUrl = supabase.storage
          .from(BUCKET)
          .getPublicUrl(file.name).data.publicUrl;
        console.log(`📄 ${file.name} (${(file as any).size || 'unknown'} bytes)`);
        console.log(`   🔗 ${publicUrl}`);
      }
    }

    // Also check Firestore content for media references
    console.log('\n🔍 Checking Firestore content for media references...');
    const db = getAdminDb();
    const contentSnapshot = await db.collection('portfolio_content').get();

    let totalMediaFiles = 0;
    for (const doc of contentSnapshot.docs) {
      const content = doc.data();
      if (content.media && Array.isArray(content.media)) {
        totalMediaFiles += content.media.length;
        console.log(`📝 ${doc.id}: ${content.media.length} media files`);
        content.media.forEach((media: any, index: number) => {
          console.log(`   ${index + 1}. ${media.url || 'No URL'}`);
        });
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total files in storage: ${files.length}`);
    console.log(`   Total media references in Firestore: ${totalMediaFiles}`);

  } catch (error) {
    console.error('❌ Error checking storage:', error);
  }
}

// Run if called directly
if (require.main === module) {
  checkSupabaseStorage();
}

export { checkSupabaseStorage };
