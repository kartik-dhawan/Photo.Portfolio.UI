/** Root folder for all uploads in this app (matches CloudinaryStorage). */
export const CLOUDINARY_APP_FOLDER = "photo-portfolio";

export function cloudinaryUploadFolder(targetUserId: string, slug: string): string {
  return `${CLOUDINARY_APP_FOLDER}/${targetUserId}/${slug}`;
}
