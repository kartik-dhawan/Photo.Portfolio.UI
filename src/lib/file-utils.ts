// Simple file utilities for upload handling
export interface FileValidation {
  isValid: boolean;
  error?: string;
  recommendation?: string;
}

export class FileUtils {
  static readonly SERVERLESS_LIMITS = {
    image: 50 * 1024 * 1024, // 50 MB
    video: 50 * 1024 * 1024, // 50 MB
  } as const;

  static readonly CLOUDINARY_LIMITS = {
    image: 10 * 1024 * 1024, // 10 MB
    video: 100 * 1024 * 1024, // 100 MB
  } as const;

  static validateFile(file: File): FileValidation {
    const fileSize = file.size;
    const fileType = file.type.startsWith("video/") ? "video" : "image";

    const serverlessLimit = this.SERVERLESS_LIMITS[fileType];
    const cloudinaryLimit = this.CLOUDINARY_LIMITS[fileType];

    // Check serverless limits first (more restrictive)
    if (fileSize > serverlessLimit) {
      const fileSizeMB = fileSize / (1024 * 1024);
      const limitMB = serverlessLimit / (1024 * 1024);
      return {
        isValid: false,
        error: `${file.name} (${fileSizeMB.toFixed(2)} MB) exceeds serverless limit (${limitMB} MB)`,
        recommendation: `Compress your ${fileType} to under ${limitMB} MB or use a file compression tool`
      };
    }

    // Then check Cloudinary limits
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

  static getFileSizeMB(file: File): string {
    return (file.size / (1024 / 1024)).toFixed(2);
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const m = 1024 * 1024;
    const g = 1024 * 1024 * 1024;

    if (bytes < k) return bytes + ' B';
    if (bytes < m) return (bytes / k).toFixed(1) + ' KB';
    if (bytes < g) return (bytes / m).toFixed(1) + ' MB';
    return (bytes / g).toFixed(2) + ' GB';
  }

  static async compressImageIfLarge(file: File): Promise<File> {
    // For now, just return the original file
    // Compression can be added later if needed
    console.log(`File compression not implemented: ${file.name} (${this.getFileSizeMB(file)} MB)`);
    return file;
  }
}
