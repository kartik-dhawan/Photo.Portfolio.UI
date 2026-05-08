import { StorageProvider, UploadResult } from './storage';
import { cloudinaryStorage } from './cloudinary';
import { supabaseStorage } from './supabase-storage';
import { isCloudinaryActive, isSupabaseActive } from './storage-config';

class StorageManager {
  private getProvider(): StorageProvider {
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
}

export const storageManager = new StorageManager();
