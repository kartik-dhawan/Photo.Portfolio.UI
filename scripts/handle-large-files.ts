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

async function handleLargeFiles() {
  console.log('🎬 Handling large files (videos & images)...');
  
  try {
    const db = getAdminDb();
    const contentSnapshot = await db.collection('portfolio_content').get();
    
    let largeFilesFound = 0;
    let videosFound = 0;
    let imagesFound = 0;
    
    for (const doc of contentSnapshot.docs) {
      const content = doc.data();
      
      if (!content.blocks || !Array.isArray(content.blocks)) continue;
      
      const userId = content.userId;
      const slug = content.slug;
      
      console.log(`\n📝 Processing: ${doc.id} (user: ${userId}, slug: ${slug})`);
      
      let documentHasLargeFiles = false;
      
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
            
            // Check file size by downloading just the headers
            try {
              console.log(`🔍 Checking file: ${fileName} (${fileExtension})`);
              
              // Download file to check size
              const { data: fileData, error: downloadError } = await supabase.storage
                .from(BUCKET)
                .download(supabasePath);
                
              if (downloadError) {
                console.log(`  ❌ Download failed: ${downloadError.message}`);
                continue;
              }
              
              if (!fileData) continue;
              
              const arrayBuffer = await fileData.arrayBuffer();
              const fileSize = arrayBuffer.byteLength;
              const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
              
              console.log(`  📊 File size: ${fileSizeMB} MB`);
              
              if (fileSize > 10 * 1024 * 1024) {
                largeFilesFound++;
                documentHasLargeFiles = true;
                
                if (fileExtension === 'mov' || fileExtension === 'mp4' || fileExtension === 'avi') {
                  videosFound++;
                  console.log(`  🎬 VIDEO: ${fileName} (${fileSizeMB} MB) - needs special handling`);
                } else {
                  imagesFound++;
                  console.log(`  🖼️ IMAGE: ${fileName} (${fileSizeMB} MB) - needs compression`);
                }
              }
              
            } catch (error) {
              console.error(`  ❌ Error checking ${fileName}:`, error);
            }
          }
        }
      }
      
      if (!documentHasLargeFiles) {
        console.log(`  ✅ All files in this document are under 10MB`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Large files found: ${largeFilesFound}`);
    console.log(`   Videos: ${videosFound}`);
    console.log(`   Large images: ${imagesFound}`);
    
    if (videosFound > 0) {
      console.log(`\n🎬 Video Handling Options:`);
      console.log(`   1. Keep videos on Supabase (recommended)`);
      console.log(`   2. Upgrade Cloudinary plan for larger video support`);
      console.log(`   3. Compress videos using FFmpeg (advanced)`);
      console.log(`   4. Use video streaming service (Vimeo, YouTube)`);
    }
    
    if (imagesFound > 0) {
      console.log(`\n🖼️ Large Image Handling Options:`);
      console.log(`   1. Compress images (recommended)`);
      console.log(`   2. Keep on Supabase`);
      console.log(`   3. Upgrade Cloudinary plan`);
    }
    
    console.log(`\n💡 Recommendation:`);
    console.log(`   Keep videos on Supabase (Cloudinary free tier has limits)`);
    console.log(`   Compress large images and migrate to Cloudinary`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  handleLargeFiles();
}

export { handleLargeFiles };
