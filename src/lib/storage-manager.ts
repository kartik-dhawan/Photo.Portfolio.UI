import { StorageProvider, UploadResult } from './storage';
import { cloudinaryStorage } from './cloudinary';
import { supabaseStorage } from './supabase-storage';
import { isCloudinaryActive, isSupabaseActive } from './storage-config';

class StorageManager {
  private getProvider(): StorageProvider {
    const provider = isCloudinaryActive() ? 'cloudinary' : isSupabaseActive() ? 'supabase' : 'none';
    console.log(`🗂️ Using storage provider: ${provider}`);

    if (isCloudinaryActive()) {
      return cloudinaryStorage;
    } else if (isSupabaseActive()) {
      return supabaseStorage;
    }
    throw new Error('No storage provider configured');
  }

  async upload(path: string, file: File): Promise<UploadResult> {
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

  // Method to sync data between providers (for migration)
  async syncToBackup(path: string, file: File): Promise<void> {
    try {
      if (isCloudinaryActive()) {
        // Sync to Supabase as backup
        await supabaseStorage.upload(path, file);
      } else if (isSupabaseActive()) {
        // Sync to Cloudinary as backup
        await cloudinaryStorage.upload(path, file);
      }
    } catch (error) {
      console.warn('Failed to sync to backup provider:', error);
      // Don't throw error - sync failure shouldn't break main operation
    }
  }
}

export const storageManager = new StorageManager();
