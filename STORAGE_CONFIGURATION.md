# Storage Configuration Guide

## Overview
This application uses Cloudinary as the primary storage solution with Supabase as a fallback option.

## Current Configuration

### Primary Storage: Cloudinary ✅
- **All 154 media files** are stored on Cloudinary
- **138 images** + **16 videos** unified on Cloudinary
- **25GB free storage** with CDN optimization
- **Global CDN** for fast delivery

### Fallback Storage: Supabase
- Available as backup option
- Configure via `STORAGE_PROVIDER=supabase` in `.env`

## Environment Variables

```bash
# Cloudinary Configuration (Primary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Supabase Configuration (Fallback)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Storage Provider Selection
STORAGE_PROVIDER=cloudinary  # or 'supabase' for fallback
```

## Switching Storage Providers

### To use Supabase (Fallback):
```bash
# Update .env file
STORAGE_PROVIDER=supabase
```

### To use Cloudinary (Primary):
```bash
# Update .env file
STORAGE_PROVIDER=cloudinary
```

## Storage Manager

The application uses a unified `StorageManager` class that automatically routes uploads to the configured provider:

- **Images**: Optimized and delivered via CDN (Cloudinary) or direct storage (Supabase)
- **Videos**: Compressed and optimized (Cloudinary) or direct storage (Supabase)
- **Fallback**: Easy switching between providers via environment variable

## Benefits of Current Setup

✅ **Unified Storage**: All media on Cloudinary  
✅ **Better Performance**: Global CDN delivery  
✅ **More Space**: 25GB vs 1GB on Supabase  
✅ **Optimization**: Automatic image/video optimization  
✅ **Fallback**: Supabase available if needed  

## Migration Status: COMPLETE ✅

- **154/154 files** successfully migrated to Cloudinary
- **0 files** remaining on Supabase
- **100% URL updates** in Firestore database
- **All media URLs** now point to Cloudinary

*Last updated: Migration completed successfully*
