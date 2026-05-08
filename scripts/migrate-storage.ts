import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminDb } from '../src/firebase/admin';
import { storageManager } from '../src/lib/storage-manager';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Configure Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'photo-portfolio';

async function migrateStorage() {
  console.log('Starting storage migration from Supabase to Cloudinary...');

  try {
    // Get all content from Firestore to know what to migrate
    const db = getAdminDb();
    const contentSnapshot = await db.collection('portfolio_content').get();

    let totalFiles = 0;
    let migratedFiles = 0;
    let errors = 0;

    for (const doc of contentSnapshot.docs) {
      const content = doc.data();

      // Check if content has blocks with media
      if (!content.blocks || !Array.isArray(content.blocks)) {
        console.log(`\n⏭️ Skipping ${doc.id} - no blocks array`);
        continue;
      }

      const userId = content.userId;
      const slug = content.slug;

      console.log(`\n📝 Processing: ${doc.id} (user: ${userId}, slug: ${slug})`);

      let documentHasMedia = false;
      let mediaItemsToUpdate: any[] = [];

      // Extract all media items from all blocks
      for (const block of content.blocks) {
        if (block.type === 'image' && block.media && Array.isArray(block.media)) {
          documentHasMedia = true;

          for (const mediaItem of block.media) {
            if (!mediaItem.url) continue;

            totalFiles++;

            try {
              // Extract path from Supabase URL
              const pathMatch = mediaItem.url.match(/\/object\/public\/[^/]+\/(.+)$/);
              if (!pathMatch) {
                console.log(`  ⏭️ Skipping non-Supabase URL: ${mediaItem.url.substring(0, 80)}...`);
                continue;
              }

              const supabasePath = pathMatch[1];
              console.log(`  📤 Migrating: ${supabasePath}`);

              // Download file from Supabase
              const { data: fileData, error: downloadError } = await supabase.storage
                .from(BUCKET)
                .download(supabasePath);

              if (downloadError) {
                console.error(`  ❌ Failed to download from Supabase: ${downloadError.message}`);
                errors++;
                continue;
              }

              if (!fileData) {
                console.error(`  ❌ No file data received from Supabase`);
                errors++;
                continue;
              }

              // Create File object from downloaded data
              const fileName = supabasePath.split('/').pop() || 'file';
              const mimeType = mediaItem.type === 'video' ? 'video/mp4' : 'image/jpeg';
              const file = new File([fileData], fileName, { type: mimeType });

              // Upload to Cloudinary using storage manager
              const result = await storageManager.upload(supabasePath, file);

              // Store the updated media item
              mediaItemsToUpdate.push({
                ...mediaItem,
                url: result.publicUrl,
                path: result.path
              });

              console.log(`  ✅ Migrated to: ${result.publicUrl}`);
              migratedFiles++;

            } catch (error) {
              console.error(`  ❌ Failed to migrate ${mediaItem.url.substring(0, 80)}...:`, error);
              errors++;
            }
          }
        }
      }

      // Update the content document with new URLs if we migrated anything
      if (mediaItemsToUpdate.length > 0) {
        // Update blocks with new URLs
        const updatedBlocks = content.blocks.map((block: any) => {
          if (block.type === 'image' && block.media && Array.isArray(block.media)) {
            return {
              ...block,
              media: block.media.map((mediaItem: any) => {
                const updatedItem = mediaItemsToUpdate.find(
                  (updated: any) => updated.path === mediaItem.path
                );
                return updatedItem || mediaItem;
              })
            };
          }
          return block;
        });

        await db.collection('portfolio_content').doc(doc.id).update({
          blocks: updatedBlocks
        });
        console.log(`  💾 Updated content document with ${mediaItemsToUpdate.length} new URLs`);
      } else if (documentHasMedia) {
        console.log(`  ℹ️ Document has media but no URLs were updated`);
      } else {
        console.log(`  📭 Document has no media blocks`);
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Total files processed: ${totalFiles}`);
    console.log(`Successfully migrated: ${migratedFiles}`);
    console.log(`Errors: ${errors}`);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateStorage();
}

export { migrateStorage };
