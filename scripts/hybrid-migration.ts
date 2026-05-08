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

async function hybridMigration() {
  console.log('🔄 Starting hybrid migration...');
  console.log('📋 Strategy: Images → Cloudinary, Videos → Supabase');
  
  try {
    const db = getAdminDb();
    const contentSnapshot = await db.collection('portfolio_content').get();
    
    let imagesMigrated = 0;
    let videosKeptOnSupabase = 0;
    let errors = 0;
    
    for (const doc of contentSnapshot.docs) {
      const content = doc.data();
      
      if (!content.blocks || !Array.isArray(content.blocks)) continue;
      
      const userId = content.userId;
      const slug = content.slug;
      
      console.log(`\n📝 Processing: ${doc.id}`);
      
      let mediaItemsToUpdate: any[] = [];
      
      for (const block of content.blocks) {
        if (block.type === 'image' && block.media && Array.isArray(block.media)) {
          for (const mediaItem of block.media) {
            if (!mediaItem.url || !mediaItem.url.includes('supabase.co')) continue;
            
            // Extract path from Supabase URL
            const pathMatch = mediaItem.url.match(/\/object\/public\/[^/]+\/(.+)$/);
            if (!pathMatch) continue;
            
            const supabasePath = pathMatch[1];
            const fileName = supabasePath.split('/').pop() || 'file';
            const fileExtension = fileName.split('.').pop()?.toLowerCase();
            
            try {
              // Download file
              console.log(`  📥 Downloading: ${fileName}`);
              const { data: fileData, error: downloadError } = await supabase.storage
                .from(BUCKET)
                .download(supabasePath);
                
              if (downloadError) {
                console.error(`    ❌ Download failed: ${downloadError.message}`);
                errors++;
                continue;
              }
              
              if (!fileData) continue;
              
              const arrayBuffer = await fileData.arrayBuffer();
              const fileSize = arrayBuffer.byteLength;
              const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
              
              // Handle based on file type and size
              if (fileExtension === 'mov' || fileExtension === 'mp4' || fileExtension === 'avi') {
                // VIDEO: Keep on Supabase
                console.log(`    🎬 VIDEO (${fileSizeMB} MB): Keeping on Supabase`);
                videosKeptOnSupabase++;
                
                // Just update the metadata to mark as video
                mediaItemsToUpdate.push({
                  ...mediaItem,
                  type: 'video',
                  storageProvider: 'supabase',
                  fileSize: fileSize
                });
                
              } else {
                // IMAGE: Try to migrate to Cloudinary
                if (fileSize <= 10 * 1024 * 1024) {
                  // Small image: Direct migration
                  console.log(`    🖼️ IMAGE (${fileSizeMB} MB): Migrating to Cloudinary`);
                  
                  const fileName = supabasePath.split('/').pop() || 'file';
                  const file = new File([arrayBuffer], fileName, { type: 'image/jpeg' });
                  
                  const result = await uploadToCloudinary(supabasePath, file);
                  
                  mediaItemsToUpdate.push({
                    ...mediaItem,
                    url: result.publicUrl,
                    path: result.path,
                    storageProvider: 'cloudinary',
                    fileSize: fileSize
                  });
                  
                  console.log(`    ✅ Migrated to: ${result.publicUrl}`);
                  imagesMigrated++;
                  
                } else {
                  // Large image: Compress then migrate
                  console.log(`    🖼️ LARGE IMAGE (${fileSizeMB} MB): Compressing...`);
                  
                  const buffer = Buffer.from(arrayBuffer);
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
                  const compressionRatio = ((fileSize - compressedSize) / fileSize * 100).toFixed(1);
                  const compressedSizeMB = (compressedSize / 1024 / 1024).toFixed(2);
                  
                  console.log(`    📊 Compressed: ${compressedSizeMB} MB (${compressionRatio}% reduction)`);
                  
                  if (compressedSize <= 10 * 1024 * 1024) {
                    const fileName = supabasePath.split('/').pop() || 'file';
                    const file = new File([compressedBuffer.buffer], fileName, { type: 'image/jpeg' });
                    
                    const result = await uploadToCloudinary(supabasePath, file);
                    
                    mediaItemsToUpdate.push({
                      ...mediaItem,
                      url: result.publicUrl,
                      path: result.path,
                      storageProvider: 'cloudinary',
                      compressed: true,
                      originalSize: fileSize,
                      compressedSize: compressedSize,
                      fileSize: compressedSize
                    });
                    
                    console.log(`    ✅ Migrated compressed image to: ${result.publicUrl}`);
                    imagesMigrated++;
                    
                  } else {
                    // Still too large, keep on Supabase
                    console.log(`    ⚠️ Still too large after compression: Keeping on Supabase`);
                    mediaItemsToUpdate.push({
                      ...mediaItem,
                      storageProvider: 'supabase',
                      compressed: true,
                      originalSize: fileSize,
                      compressedSize: compressedSize,
                      fileSize: fileSize
                    });
                  }
                }
              }
              
            } catch (error) {
              console.error(`    ❌ Error processing ${fileName}:`, error);
              errors++;
            }
          }
        }
      }
      
      // Update document if we have changes
      if (mediaItemsToUpdate.length > 0) {
        const updatedBlocks = content.blocks.map((block: any) => {
          if (block.type === 'image' && block.media && Array.isArray(block.media)) {
            return {
              ...block,
              media: block.media.map((mediaItem: any) => {
                const updatedItem = mediaItemsToUpdate.find(
                  (updated: any) => updated.url === mediaItem.url
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
        console.log(`  💾 Updated document with ${mediaItemsToUpdate.length} media items`);
      }
    }
    
    console.log(`\n🎉 Hybrid migration complete!`);
    console.log(`📊 Results:`);
    console.log(`   Images migrated to Cloudinary: ${imagesMigrated}`);
    console.log(`   Videos kept on Supabase: ${videosKeptOnSupabase}`);
    console.log(`   Errors: ${errors}`);
    
    console.log(`\n✅ Benefits:`);
    console.log(`   🖼️ Images now on Cloudinary (25GB storage, CDN, optimization)`);
    console.log(`   🎬 Videos stay on Supabase (no size limits)`);
    console.log(`   🔄 Smart storage allocation based on file type`);
    
  } catch (error) {
    console.error('❌ Hybrid migration failed:', error);
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
  hybridMigration();
}

export { hybridMigration };
