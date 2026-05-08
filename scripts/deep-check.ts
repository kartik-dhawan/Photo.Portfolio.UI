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

async function deepCheck() {
  console.log('🔍 Deep checking Supabase storage...');
  
  try {
    // Check 1: List all folders at root
    console.log('\n📁 Checking root level folders...');
    const { data: rootItems, error: rootError } = await supabase.storage
      .from(BUCKET)
      .list('', { limit: 100 });

    if (rootError) {
      console.error('❌ Root list error:', rootError);
    } else {
      console.log(`Found ${rootItems?.length || 0} items at root level`);
      rootItems?.forEach(item => {
        console.log(`  ${item.name} ${!item.id ? '(folder)' : '(file)'}`);
      });
    }

    // Check 2: List all files recursively by checking common user folders
    console.log('\n🔍 Checking for user folders...');
    const commonUserIds = [
      'w9Z48xdapWeV7fz9pKmsyZguESF3', // Your user ID from .env
      // Add any other user IDs you might have
    ];

    let totalFiles = 0;
    let allFolders = [];

    for (const userId of commonUserIds) {
      console.log(`\n👤 Checking user: ${userId}`);
      
      try {
        const { data: userFolders, error: folderError } = await supabase.storage
          .from(BUCKET)
          .list(userId, { limit: 100 });

        if (folderError) {
          console.log(`  ❌ Error listing ${userId}:`, folderError.message);
        } else if (userFolders && userFolders.length > 0) {
          console.log(`  📁 Found ${userFolders.length} folders for ${userId}`);
          allFolders.push(...userFolders.map(f => ({ userId, folder: f })));
          
          // Check contents of each folder
          for (const folder of userFolders) {
            const folderPath = `${userId}/${folder.name}`;
            console.log(`    📂 Checking ${folderPath}`);
            
            const { data: files, error: fileError } = await supabase.storage
              .from(BUCKET)
              .list(folderPath, { limit: 200 });

            if (fileError) {
              console.log(`      ❌ Error listing files:`, fileError.message);
            } else if (files && files.length > 0) {
              console.log(`      📄 Found ${files.length} files`);
              totalFiles += files.length;
              
              files.forEach(file => {
                const publicUrl = supabase.storage
                  .from(BUCKET)
                  .getPublicUrl(`${folderPath}/${file.name}`).data.publicUrl;
                console.log(`        📎 ${file.name} (${(file as any).size || 'unknown'} bytes)`);
                console.log(`          🔗 ${publicUrl}`);
              });
            }
          }
        } else {
          console.log(`  📭 No folders found for ${userId}`);
        }
      } catch (err) {
        console.log(`  ❌ Error checking ${userId}:`, err);
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Total folders found: ${allFolders.length}`);
    console.log(`   Total files found: ${totalFiles}`);

    // Check 3: Firestore content
    console.log('\n🔥 Checking Firestore content...');
    const db = getAdminDb();
    
    try {
      // Check all collections
      const collections = await db.listCollections();
      console.log(`📚 Found ${collections.length} collections:`);
      
      for (const collection of collections) {
        console.log(`  📖 ${collection.id}`);
        
        if (collection.id.includes('content') || collection.id.includes('portfolio')) {
          const snapshot = await collection.get();
          console.log(`    📄 ${snapshot.size} documents`);
          
          let mediaCount = 0;
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data.media && Array.isArray(data.media)) {
              mediaCount += data.media.length;
              console.log(`      📝 ${doc.id}: ${data.media.length} media items`);
              
              data.media.forEach((media: any, index: number) => {
                if (media.url) {
                  console.log(`        ${index + 1}. ${media.url.substring(0, 100)}...`);
                }
              });
            }
          });
          console.log(`    🖼️ Total media in ${collection.id}: ${mediaCount}`);
        }
      }
    } catch (firestoreError) {
      console.error('❌ Firestore error:', firestoreError);
    }

  } catch (error) {
    console.error('❌ General error:', error);
  }
}

// Run if called directly
if (require.main === module) {
  deepCheck();
}

export { deepCheck };
