import { StorageProvider, UploadResult } from './storage';
import { cloudinaryStorage } from './cloudinary';
import { supabaseStorage } from './supabase-storage';
import { isCloudinaryActive, isSupabaseActive } from './storage-config';

// Cloudinary limits (Free tier)
const CLOUDINARY_LIMITS = {
  image: 10 * 1024 * 1024, // 10 MB
  video: 100 * 1024 * 1024, // 100 MB
} as const;

class StorageManager {
  private getProvider(): StorageProvider {
    if (isCloudinaryActive()) {
      return cloudinaryStorage;
    } else if (isSupabaseActive()) {
      return supabaseStorage;
    }
    throw new Error('No storage provider configured');
  }

  private validateFileSize(file: File): void {
    const type: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
    const fileSize = file.size;
    const maxSize = CLOUDINARY_LIMITS[type];

    if (isCloudinaryActive() && fileSize > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      const fileSizeMB = fileSize / (1024 * 1024);
      throw new Error(
        `File size (${fileSizeMB.toFixed(2)} MB) exceeds Cloudinary ${type} limit (${maxSizeMB} MB). ` +
        `Please compress your ${type} or upgrade your Cloudinary plan.`
      );
    }
  }

  async upload(path: string, file: File): Promise<UploadResult> {
    // Validate file size before upload
    this.validateFileSize(file);

    const provider = this.getProvider();
    const result = await provider.upload(path, file);

    const type: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";

    return {
      publicUrl: result.url,
      path: result.path,
      type,
    };
  }

  async delete(paths: string[]): Promise<void> {
    const provider = this.getProvider();
    await provider.delete(paths);
  }

  getPublicUrl(path: string): string {
    const provider = this.getProvider();
    return provider.getPublicUrl(path);
  }
}

export const storageManager = new StorageManager();
