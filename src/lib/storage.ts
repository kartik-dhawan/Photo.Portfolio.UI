export interface StorageProvider {
  upload(path: string, file: File): Promise<{ url: string; path: string }>;
  delete(paths: string[]): Promise<void>;
  getPublicUrl(path: string): string;
}

export interface UploadResult {
  publicUrl: string;
  path: string;
  type: "image" | "video";
}
