import { getSupabaseAdmin } from '@/supabase/admin';
import { StorageProvider } from './storage';

export class SupabaseStorage implements StorageProvider {
  private bucket: string = 'photo-portfolio';

  async upload(path: string, file: File): Promise<{ url: string; path: string }> {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);

    return {
      url: data.publicUrl,
      path,
    };
  }

  async delete(paths: string[]): Promise<void> {
    const supabase = getSupabaseAdmin();
    
    const { error } = await supabase.storage
      .from(this.bucket)
      .remove(paths);

    if (error) {
      throw new Error(`Supabase delete failed: ${error.message}`);
    }
  }

  getPublicUrl(path: string): string {
    const supabase = getSupabaseAdmin();
    const { data } = supabase.storage
      .from(this.bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
}

export const supabaseStorage = new SupabaseStorage();
