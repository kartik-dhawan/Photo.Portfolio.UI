# Storage Migration Guide: Supabase to Cloudinary

## Overview
This implementation provides a dual-storage system that allows you to migrate from Supabase to Cloudinary while maintaining Supabase as a backup for easy rollback.

## Setup Instructions

### 1. Configure Cloudinary
1. Create a Cloudinary account at https://cloudinary.com
2. Get your Cloudinary credentials:
   - Cloud Name
   - API Key  
   - API Secret

### 2. Update Environment Variables
Add to your `.env` file:
```bash
# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Storage Provider (cloudinary or supabase)
STORAGE_PROVIDER=cloudinary
```

### 3. Migration Options

#### Option A: Gradual Migration (Recommended)
Keep `STORAGE_PROVIDER=supabase` to continue using Supabase while testing Cloudinary:
- New uploads will go to Supabase
- You can test Cloudinary by temporarily switching to `cloudinary`
- Rollback is instant by changing the environment variable

#### Option B: Full Migration
Set `STORAGE_PROVIDER=cloudinary` to immediately use Cloudinary:
- All new uploads go to Cloudinary
- Existing Supabase files remain accessible
- Automatic backup sync to Supabase (configurable)

### 4. Data Migration Script
Run the migration script to move existing files:
```bash
# Set environment variables first
export CLOUDINARY_CLOUD_NAME=your_cloud_name
export CLOUDINARY_API_KEY=your_api_key
export CLOUDINARY_API_SECRET=your_api_secret

# Run migration
npx tsx scripts/migrate-storage.ts
```

## Features

### Dual Storage System
- **Primary Storage**: Configurable via `STORAGE_PROVIDER` environment variable
- **Backup Storage**: Automatic sync to secondary provider
- **Instant Rollback**: Change environment variable to switch providers

### Provider Support
- **Cloudinary**: 25GB free storage, built-in CDN, image optimization
- **Supabase**: Existing storage, maintained for backup

### API Compatibility
- All existing API endpoints work unchanged
- Upload hooks automatically handle provider switching
- No frontend code changes required

## File Structure
```
src/lib/
├── storage-config.ts      # Provider configuration
├── storage.ts            # Storage interface
├── storage-manager.ts    # Unified storage management
├── cloudinary.ts         # Cloudinary implementation
└── supabase-storage.ts  # Supabase wrapper
```

## Testing
1. Start with `STORAGE_PROVIDER=supabase`
2. Upload a test file
3. Change to `STORAGE_PROVIDER=cloudinary`
4. Upload another test file
5. Verify both files are accessible
6. Delete files to test cleanup

## Rollback
To rollback to Supabase:
1. Set `STORAGE_PROVIDER=supabase`
2. Restart the application
3. All operations will use Supabase again

## Benefits of Cloudinary
- **25GB Free Storage**: vs Supabase's 1GB limit
- **Image Optimization**: Automatic compression and format conversion
- **Global CDN**: Faster delivery worldwide
- **Transformations**: Resize, crop, filter on the fly
- **No Time Limit**: Free tier doesn't expire

## Monitoring
Check your Cloudinary dashboard at https://cloudinary.com/console to monitor:
- Storage usage
- Bandwidth consumption
- API requests
- Transformation statistics

## Troubleshooting

### Build Errors
- Ensure all environment variables are set
- Check Cloudinary credentials are correct
- Verify `STORAGE_PROVIDER` is either `cloudinary` or `supabase`

### Upload Failures
- Check Cloudinary API limits (25GB storage, 25GB bandwidth)
- Verify file formats are supported
- Check network connectivity

### Migration Issues
- Ensure Supabase service role key has read permissions
- Check Cloudinary upload permissions
- Monitor migration script output for errors
