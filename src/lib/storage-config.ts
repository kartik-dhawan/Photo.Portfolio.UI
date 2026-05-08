export const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'cloudinary';

export const isCloudinaryActive = () => STORAGE_PROVIDER === 'cloudinary';
export const isSupabaseActive = () => STORAGE_PROVIDER === 'supabase';
