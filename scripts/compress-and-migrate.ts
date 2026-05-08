import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import { getAdminDb } from '../src/firebase/admin';
import { config } from 'dotenv';
import sharp from 'sharp';

// Load environment variables
config({ path: '.env' });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET = 'photo-portfolio';

async function compressAndMigrate() {
  console.log('🗜️ Compressing and migrating large files...');

  try {
    const db = getAdminDb();
    const contentSnapshot = await db.collection('portfolio_content').get();

    let largeFilesFound = 0;
    let successfullyMigrated = 0;

    for (const doc of contentSnapshot.docs) {
      const content = doc.data();

      if (!content.blocks || !Array.isArray(content.blocks)) continue;

      const userId = content.userId;
      const slug = content.slug;

      let documentHasLargeFiles = false;
      let mediaItemsToUpdate: any[] = [];

      for (const block of content.blocks) {
        if (block.type === 'image' && block.media && Array.isArray(block.media)) {
          for (const mediaItem of block.media) {
            if (!mediaItem.url || !mediaItem.url.includes('supabase.co')) continue;

            // Check if this is one of the failed large files
            const pathMatch = mediaItem.url.match(/\/object\/public\/[^/]+\/(.+)$/);
            if (!pathMatch) continue;

            const supabasePath = pathMatch[1];

            try {
              // Download the large file
              console.log(`\n📥 Downloading large file: ${supabasePath}`);
              const { data: fileData, error: downloadError } = await supabase.storage
                .from(BUCKET)
                .download(supabasePath);

              if (downloadError) {
                console.error(`❌ Failed to download: ${downloadError.message}`);
                continue;
              }

              if (!fileData) continue;

              // Get file size
              const arrayBuffer = await fileData.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const originalSize = buffer.length;
              console.log(`📊 Original size: ${(originalSize / 1024 / 1024).toFixed(2)} MB`);

              if (originalSize <= 10 * 1024 * 1024) {
                console.log(`✅ File is under 10MB, skipping compression`);
                continue;
              }

              largeFilesFound++;
              documentHasLargeFiles = true;

              // Compress the image
              console.log(`🗜️ Compressing image...`);
              const compressedBuffer = await sharp(buffer)
                .resize(2048, 2048, {
                  fit: 'inside',
                  withoutEnlargement: true
                })
                .jpeg({
                  quality: 85,
                  progressive: true
                })
                .toBuffer();

              const compressedSize = compressedBuffer.length;
              const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
              console.log(`📊 Compressed size: ${(compressedSize / 1024 / 1024).toFixed(2)} MB (${compressionRatio}% reduction)`);

              if (compressedSize > 10 * 1024 * 1024) {
                console.log(`⚠️ Still too large after compression, trying more aggressive compression...`);

                const moreCompressedBuffer = await sharp(buffer)
                  .resize(1920, 1920, {
                    fit: 'inside',
                    withoutEnlargement: true
                  })
                  .jpeg({
                    quality: 70,
                    progressive: true
                  })
                  .toBuffer();

                const finalSize = moreCompressedBuffer.length;
                const finalCompressionRatio = ((originalSize - finalSize) / originalSize * 100).toFixed(1);
                console.log(`📊 Final compressed size: ${(finalSize / 1024 / 1024).toFixed(2)} MB (${finalCompressionRatio}% reduction)`);

                if (finalSize <= 10 * 1024 * 1024) {
                  // Upload the more compressed version
                  const fileName = supabasePath.split('/').pop() || 'file';
                  const file = new File([Buffer.from(moreCompressedBuffer)], fileName, { type: 'image/jpeg' });

                  const result = await uploadToCloudinary(supabasePath, file);

                  mediaItemsToUpdate.push({
                    ...mediaItem,
                    url: result.publicUrl,
                    path: result.path,
                    compressed: true,
                    originalSize: originalSize,
                    compressedSize: finalSize
                  });

                  console.log(`✅ Successfully migrated compressed file to: ${result.publicUrl}`);
                  successfullyMigrated++;
                } else {
                  console.log(`❌ File still too large after compression: ${(finalSize / 1024 / 1024).toFixed(2)} MB`);
                }
              } else {
                // Upload the compressed version
                const fileName = supabasePath.split('/').pop() || 'file';
                const file = new File([Buffer.from(compressedBuffer)], fileName, { type: 'image/jpeg' });

                const result = await uploadToCloudinary(supabasePath, file);

                mediaItemsToUpdate.push({
                  ...mediaItem,
                  url: result.publicUrl,
                  path: result.path,
                  compressed: true,
                  originalSize: originalSize,
                  compressedSize: compressedSize
                });

                console.log(`✅ Successfully migrated compressed file to: ${result.publicUrl}`);
                successfullyMigrated++;
              }

            } catch (error) {
              console.error(`❌ Failed to process ${mediaItem.url}:`, error);
            }
          }
        }
      }

      // Update document if we have updates
      if (mediaItemsToUpdate.length > 0) {
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
        console.log(`💾 Updated document with ${mediaItemsToUpdate.length} compressed files`);
      }
    }

    console.log(`\n🎉 Compression and migration complete!`);
    console.log(`📊 Summary:`);
    console.log(`   Large files found: ${largeFilesFound}`);
    console.log(`   Successfully migrated: ${successfullyMigrated}`);
    console.log(`   Compression applied to all files over 10MB`);

  } catch (error) {
    console.error('❌ Compression/migration failed:', error);
  }
}

async function uploadToCloudinary(path: string, file: File): Promise<{ publicUrl: string; path: string }> {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      resource_type: 'auto' as const,
      folder: `photo-portfolio/${path.split('/').slice(0, -1).join('/')}`,
      public_id: path.split('/').pop()?.split('.')[0],
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          reject(new Error(`Cloudinary upload failed: ${error.message}`));
        } else if (result) {
          resolve({
            publicUrl: result.secure_url,
            path: `${result.folder}/${result.public_id}.${result.format}`,
          });
        }
      }
    );

    file.arrayBuffer().then(buffer => {
      uploadStream.end(Buffer.from(buffer));
    }).catch(reject);
  });
}

// Run if called directly
if (require.main === module) {
  compressAndMigrate();
}

export { compressAndMigrate };
