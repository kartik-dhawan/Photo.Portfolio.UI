import { v2 as cloudinary } from 'cloudinary';
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

async function testCloudinary() {
  console.log('🧪 Testing Cloudinary connection...');

  try {
    // Test 1: Simple ping test
    console.log('✅ Cloudinary configuration loaded');
    console.log(`📊 Account: ${process.env.CLOUDINARY_CLOUD_NAME}`);

    // Test 2: Test upload with a tiny image
    console.log('📤 Testing upload...');

    const testResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'test',
          public_id: 'test-image',
          resource_type: 'auto' as const,
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Create a tiny test image (1x1 pixel PNG)
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
        0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
        0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
        0x54, 0x08, 0x99, 0x01, 0x01, 0x01, 0x00, 0x00,
        0xFE, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
      ]);

      uploadStream.end(testImageBuffer);
    });

    console.log('✅ Upload test successful');
    console.log(`🔗 Test image URL: ${(testResult as any).secure_url}`);

    // Clean up test image
    await cloudinary.api.delete_resources(['test/test-image']);
    console.log('🧹 Test image cleaned up');

    console.log('\n🎉 Cloudinary is fully operational!');

  } catch (error) {
    console.error('❌ Cloudinary test failed:', error);
    console.log('\n🔧 Please check:');
    console.log('   1. Cloudinary credentials are correct');
    console.log('   2. Network connection is stable');
    console.log('   3. Cloudinary account is active');
  }
}

// Run if called directly
if (require.main === module) {
  testCloudinary();
}

export { testCloudinary };
