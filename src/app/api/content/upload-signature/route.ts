import { verifyAuth, canEdit } from "@/lib/auth";
import { signBrowserDirectUpload } from "@/lib/cloudinary";

const CLOUDINARY_LIMITS = {
  image: 10 * 1024 * 1024,
  video: 100 * 1024 * 1024,
} as const;

export const maxDuration = 30;

export async function POST(request: Request) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: {
      slug?: string;
      userId?: string;
      fileSize?: number;
      mimeType?: string;
    };
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { slug, userId: bodyUserId, fileSize, mimeType } = body;
    if (!slug || typeof fileSize !== "number") {
      return Response.json(
        { error: "slug and fileSize are required" },
        { status: 400 }
      );
    }

    const targetUserId = bodyUserId ?? authUser.uid;
    if (!canEdit(authUser, targetUserId)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const fileKind: "image" | "video" =
      typeof mimeType === "string" && mimeType.startsWith("video/")
        ? "video"
        : "image";
    const limit = CLOUDINARY_LIMITS[fileKind];
    if (fileSize > limit) {
      const limitMB = limit / (1024 * 1024);
      return Response.json(
        {
          error: `File exceeds Cloudinary ${fileKind} limit (${limitMB} MB).`,
        },
        { status: 413 }
      );
    }

    const signed = signBrowserDirectUpload(targetUserId, slug);
    return Response.json(signed);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create upload signature";
    return Response.json({ error: message }, { status: 500 });
  }
}
