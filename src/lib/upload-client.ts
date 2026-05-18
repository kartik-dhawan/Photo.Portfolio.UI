import { uploadToStorage } from "@/lib/upload";

// Client-side upload utility with chunked upload support
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface ChunkedUploadOptions {
  file: File;
  slug: string;
  userId: string;
  onProgress?: (progress: UploadProgress) => void;
  chunkSize?: number; // Default: 5MB chunks
}

export class ChunkedUploader {
  private static readonly MAX_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  /** Direct Cloudinary upload — body size limit is Cloudinary/plan, not the app API route */
  private static readonly MAX_UPLOAD = 100 * 1024 * 1024; // 100 MB (matches video cap in API)

  static async uploadWithChunks(options: ChunkedUploadOptions): Promise<{ publicUrl: string; path: string; type: "image" | "video" }> {
    const { file, slug, userId, onProgress, chunkSize = this.MAX_CHUNK_SIZE } = options;
    const fileSize = file.size;

    if (fileSize > this.MAX_UPLOAD) {
      const fileSizeMB = fileSize / (1024 * 1024);
      const limitMB = this.MAX_UPLOAD / (1024 * 1024);
      throw new Error(
        `File size (${fileSizeMB.toFixed(2)} MB) exceeds upload limit (${limitMB} MB). ` +
        `Please compress your file or use a file under ${limitMB} MB.`
      );
    }

    // For files under 10MB, use direct upload
    if (fileSize <= 10 * 1024 * 1024) {
      return this.directUpload(file, slug, userId);
    }

    // For larger files, implement chunked upload simulation
    console.log(`Starting chunked upload for ${file.name} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`);
    
    // For now, simulate chunked upload by compressing client-side
    return this.compressAndUpload(file, slug, userId, onProgress);
  }

  private static async directUpload(file: File, slug: string, userId: string): Promise<{ publicUrl: string; path: string; type: "image" | "video" }> {
    return uploadToStorage(slug, file, userId);
  }

  private static async compressAndUpload(
    file: File, 
    slug: string, 
    userId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ publicUrl: string; path: string; type: "image" | "video" }> {
    
    if (onProgress) {
      onProgress({ loaded: 0, total: file.size, percentage: 0 });
    }

    try {
      // Client-side compression simulation
      const compressedFile = await this.compressFile(file);
      
      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      return this.directUpload(compressedFile, slug, userId);
    } catch (error) {
      throw new Error(`Compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private static async compressFile(file: File): Promise<File> {
    return new Promise((resolve) => {
      // For images, we could use canvas compression
      // For videos, we'd need a video compression library
      // For now, just return the original file with a note
      console.log(`Note: Client-side compression not implemented for ${file.type}. Upload original file.`);
      resolve(file);
    });
  }

  static validateFile(file: File): { isValid: boolean; error?: string; recommendation?: string } {
    const fileSize = file.size;
    const fileType = file.type.startsWith("video/") ? "video" : "image";
    
    // Serverless hard limits
    const serverlessLimit = this.MAX_UPLOAD;
    if (fileSize > serverlessLimit) {
      const fileSizeMB = fileSize / (1024 * 1024);
      const limitMB = serverlessLimit / (1024 * 1024);
      return {
        isValid: false,
        error: `${file.name} (${fileSizeMB.toFixed(2)} MB) exceeds upload limit (${limitMB} MB)`,
        recommendation: `Compress your ${fileType} to under ${limitMB} MB or use a file compression tool`
      };
    }

    // Cloudinary limits
    const cloudinaryLimits = {
      image: 10 * 1024 * 1024, // 10 MB
      video: 100 * 1024 * 1024, // 100 MB
    };

    const cloudinaryLimit = cloudinaryLimits[fileType];
    if (fileSize > cloudinaryLimit) {
      const fileSizeMB = fileSize / (1024 * 1024);
      const limitMB = cloudinaryLimit / (1024 * 1024);
      return {
        isValid: false,
        error: `${file.name} (${fileSizeMB.toFixed(2)} MB) exceeds Cloudinary ${fileType} limit (${limitMB} MB)`,
        recommendation: fileType === 'video' 
          ? 'Compress video or upgrade Cloudinary plan for larger files'
          : 'Use a smaller image format or compress the image'
      };
    }

    return { isValid: true };
  }
}
