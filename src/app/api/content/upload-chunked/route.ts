import { verifyAuth } from "@/lib/auth";
import { storageManager } from "@/lib/storage-manager";

// Chunked upload for large files that exceed serverless limits
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
    const chunkIndex = parseInt(formData.get('chunkIndex') as string || '0');
    const totalChunks = parseInt(formData.get('totalChunks') as string || '1');
    const fileId = formData.get('fileId') as string;

    if (!file || !slug) {
      return Response.json(
        { error: "file, slug, and fileId are required" },
        { status: 400 }
      );
    }

    // Use provided userId (for superAdmin acting on behalf) or auth user's uid
    const targetUserId = userId ?? authUser.uid;

    // For chunked uploads, we need to handle this differently
    if (totalChunks > 1) {
      // This would require implementing chunked upload logic
      // For now, return error suggesting direct upload
      return Response.json({
        error: "Chunked uploads not yet implemented. Please use files under 50MB for direct upload.",
        suggestion: "Try compressing your file or contact support for larger file uploads."
      }, { status: 501 });
    }

    // For single chunk (normal upload), check file size
    const fileType: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
    const fileSize = file.size;
    
    // Serverless function limits - be more conservative
    const SERVERLESS_LIMITS = {
      image: 50 * 1024 * 1024, // 50 MB for images
      video: 50 * 1024 * 1024, // 50 MB for videos
    } as const;

    if (fileSize > SERVERLESS_LIMITS[fileType]) {
      const fileSizeMB = fileSize / (1024 * 1024);
      const limitMB = SERVERLESS_LIMITS[fileType] / (1024 * 1024);
      return Response.json({
        error: `File size (${fileSizeMB.toFixed(2)} MB) exceeds serverless limit (${limitMB} MB).`,
        details: {
          fileName: file.name,
          fileType,
          fileSizeMB: fileSizeMB.toFixed(2),
          limitMB: limitMB,
          suggestion: `Try compressing the ${fileType} or splitting into smaller files`,
          alternative: "Use a video compression tool before uploading"
        }
      }, { status: 413 }); // 413 Payload Too Large
    }

    const ext = file.name.split(".").pop() || "bin";
    const path = `${targetUserId}/${slug}/${Date.now()}.${ext}`;

    // Use storage manager for unified upload
    const result = await storageManager.upload(path, file);

    return Response.json({
      ...result,
      uploadInfo: {
        fileName: file.name,
        fileSizeMB: (fileSize / (1024 * 1024)).toFixed(2),
        fileType,
        uploadedAt: new Date().toISOString(),
        uploadMethod: "chunked-api"
      }
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to upload file";
    
    return Response.json({ error: message }, { status: 500 });
  }
}
