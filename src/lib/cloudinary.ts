import { v2 as cloudinary } from 'cloudinary';
import { cloudinaryUploadFolder } from './cloudinary-constants';
import { StorageProvider } from './storage';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export class CloudinaryStorage implements StorageProvider {
  async upload(path: string, file: File): Promise<{ url: string; path: string }> {
    const segments = path.split('/');
    const filename = segments.pop() ?? "asset";
    const publicId = filename.replace(/\.[^/.]+$/, "");
    const folder = cloudinaryUploadFolder(segments[0] ?? "", segments[1] ?? "");
    const uploadOptions = {
      resource_type: 'auto' as const,
      folder,
      public_id: publicId,
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else if (result) {
            resolve({
              url: result.secure_url,
              path: `${result.folder}/${result.public_id}.${result.format}`,
            });
          }
        }
      );

      // Convert File to Buffer for Cloudinary
      file.arrayBuffer().then(buffer => {
        uploadStream.end(Buffer.from(buffer));
      }).catch(reject);
    });
  }

  async delete(paths: string[]): Promise<void> {
    const publicIds = paths.map(path => {
      // Extract public ID from Cloudinary URL or path
      const parts = path.split('/');
      const filename = parts[parts.length - 1];
      const folder = parts.slice(0, -1).join('/');
      const publicId = filename.replace(/\.[^/.]+$/, '');
      return `${folder}/${publicId}`;
    });

    const result = await cloudinary.api.delete_resources(publicIds);

    if (result.deleted && Object.values(result.deleted).some(deleted => deleted !== 'deleted')) {
      throw new Error('Some files failed to delete from Cloudinary');
    }
  }

  getPublicUrl(path: string): string {
    return cloudinary.url(path, { secure: true });
  }
}

export const cloudinaryStorage = new CloudinaryStorage();

/** Signed params for browser → Cloudinary direct upload (bypasses app server body limits). */
export function signBrowserDirectUpload(targetUserId: string, slug: string) {
  const public_id = `${Date.now()}`;
  const folder = cloudinaryUploadFolder(targetUserId, slug);
  const timestamp = Math.round(Date.now() / 1000);
  const params = {
    timestamp,
    folder,
    public_id,
  };
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  if (!apiKey || !apiSecret || !cloudName) {
    throw new Error("Cloudinary is not configured");
  }
  const signed = cloudinary.utils.sign_request(params, {
    api_key: apiKey,
    api_secret: apiSecret,
  });
  return {
    ...signed,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
  };
}
