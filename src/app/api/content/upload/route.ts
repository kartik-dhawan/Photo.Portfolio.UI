import { verifyAuth } from "@/lib/auth";
import { storageManager } from "@/lib/storage-manager";

// Cloudinary limits for better error messages
const CLOUDINARY_LIMITS = {
  image: { size: 10 * 1024 * 1024, sizeMB: 10 }, // 10 MB
  video: { size: 100 * 1024 * 1024, sizeMB: 100 }, // 100 MB
} as const;

export async function POST(request: Request) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const slug = formData.get('slug') as string;
    const userId = formData.get('userId') as string;

    if (!file || !slug) {
      return Response.json(
        { error: "file and slug are required" },
        { status: 400 }
      );
    }

    // Pre-validate file size for better UX
    const fileType: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
    const fileSize = file.size;
    const limit = CLOUDINARY_LIMITS[fileType];

    if (fileSize > limit.size) {
      const fileSizeMB = fileSize / (1024 * 1024);
      return Response.json({
        error: `File size (${fileSizeMB.toFixed(2)} MB) exceeds Cloudinary ${fileType} limit (${limit.sizeMB} MB).`,
        details: {
          fileName: file.name,
          fileType,
          fileSizeMB: fileSizeMB.toFixed(2),
          limitMB: limit.sizeMB,
          suggestion: fileType === 'image'
            ? 'Try compressing the image or use a smaller format'
            : 'Try compressing the video or upgrade your Cloudinary plan'
        }
      }, { status: 413 }); // 413 Payload Too Large
    }

    // Use provided userId (for superAdmin acting on behalf) or auth user's uid
    const targetUserId = userId ?? authUser.uid;

    const ext = file.name.split(".").pop() || "bin";
    const path = `${targetUserId}/${slug}/${Date.now()}.${ext}`;

    // Use storage manager for unified upload (Cloudinary or Supabase)
    const result = await storageManager.upload(path, file);

    return Response.json({
      ...result,
      uploadInfo: {
        fileName: file.name,
        fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
        fileType,
        uploadedAt: new Date().toISOString()
      }
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to upload file";

    // Check if it's a file size error from storage manager
    if (message.includes('exceeds Cloudinary')) {
      return Response.json({
        error: message,
        type: 'file_size_error'
      }, { status: 413 }); // 413 Payload Too Large
    }

    return Response.json({ error: message }, { status: 500 });
  }
}
