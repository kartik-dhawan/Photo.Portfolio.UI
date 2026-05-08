import { getAdminDb } from '../src/firebase/admin';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env' });

async function fixFirestoreUrls() {
  console.log('🔧 Fixing Firestore URLs...');
  console.log('This will update all Supabase URLs to Cloudinary URLs');
  
  try {
    const db = getAdminDb();
    const contentSnapshot = await db.collection('portfolio_content').get();
    
    let totalDocuments = 0;
    let documentsUpdated = 0;
    let totalUrlsUpdated = 0;
    
    for (const doc of contentSnapshot.docs) {
      const content = doc.data();
      totalDocuments++;
      
      if (!content.blocks || !Array.isArray(content.blocks)) continue;
      
      const userId = content.userId;
      const slug = content.slug;
      
      let hasChanges = false;
      let urlUpdates = 0;
      
      console.log(`\n📝 Processing: ${doc.id} (${slug})`);
      
      const updatedBlocks = content.blocks.map((block: any) => {
        if (block.type === 'image' && block.media && Array.isArray(block.media)) {
          const updatedMedia = block.media.map((mediaItem: any) => {
            if (mediaItem.url && mediaItem.url.includes('supabase.co')) {
              // Extract path from Supabase URL
              const pathMatch = mediaItem.url.match(/\/object\/public\/[^/]+\/(.+)$/);
              if (pathMatch) {
                const supabasePath = pathMatch[1];
                const fileName = supabasePath.split('/').pop() || 'file';
                const fileExtension = fileName.split('.').pop()?.toLowerCase();
                
                // Check if this is a video (keep on Supabase) or image (move to Cloudinary)
                if (fileExtension === 'mov' || fileExtension === 'mp4' || fileExtension === 'avi') {
                  console.log(`  🎬 Keeping video on Supabase: ${fileName}`);
                  return {
                    ...mediaItem,
                    storageProvider: 'supabase',
                    type: 'video'
                  };
                } else {
                  // Convert to Cloudinary URL
                  const cloudinaryUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/photo-portfolio/${supabasePath}`;
                  console.log(`  🖼️ Updating image to Cloudinary: ${fileName}`);
                  console.log(`     ${mediaItem.url.substring(0, 60)}...`);
                  console.log(`     → ${cloudinaryUrl.substring(0, 60)}...`);
                  
                  hasChanges = true;
                  urlUpdates++;
                  
                  return {
                    ...mediaItem,
                    url: cloudinaryUrl,
                    storageProvider: 'cloudinary',
                    type: 'image'
                  };
                }
              }
            }
            return mediaItem;
          });
          
          return {
            ...block,
            media: updatedMedia
          };
        }
        return block;
      });
      
      // Update the document if we made changes
      if (hasChanges) {
        await db.collection('portfolio_content').doc(doc.id).update({
          blocks: updatedBlocks
        });
        
        documentsUpdated++;
        totalUrlsUpdated += urlUpdates;
        
        console.log(`  💾 Updated document with ${urlUpdates} URL changes`);
      } else {
        console.log(`  ℹ️ No changes needed`);
      }
    }
    
    console.log(`\n🎉 URL Update Complete!`);
    console.log(`📊 Results:`);
    console.log(`   Total documents processed: ${totalDocuments}`);
    console.log(`   Documents updated: ${documentsUpdated}`);
    console.log(`   Total URLs updated: ${totalUrlsUpdated}`);
    
    console.log(`\n✅ All image URLs now point to Cloudinary`);
    console.log(`🎬 Video URLs remain on Supabase`);
    
  } catch (error) {
    console.error('❌ URL update failed:', error);
  }
}

// Run if called directly
if (require.main === module) {
  fixFirestoreUrls();
}

export { fixFirestoreUrls };
