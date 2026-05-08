import { getSupabaseAdmin } from "@/supabase/admin";
import { verifyAuth } from "@/lib/auth";
import { storageManager } from "@/lib/storage-manager";
import { isCloudinaryActive, isSupabaseActive } from "@/lib/storage-config";

const BUCKET = "photo-portfolio";

export async function POST(request: Request) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { urls } = (await request.json()) as { urls: string[] };
    if (!urls?.length) {
      return Response.json({ error: "urls required" }, { status: 400 });
    }

    // Use storage manager for unified deletion
    try {
      // Extract paths from URLs for both Cloudinary and Supabase
      const paths = urls.map((url) => {
        // For Supabase URLs
        const supabaseMatch = url.match(/\/object\/public\/[^/]+\/(.+)$/);
        if (supabaseMatch) return supabaseMatch[1];

        // For Cloudinary URLs - extract the path part
        const cloudinaryMatch = url.match(/\/image\/upload\/(.+)$/);
        if (cloudinaryMatch) return cloudinaryMatch[1];

        // If it's already a path, return as-is
        if (!url.startsWith('http')) return url;

        return null;
      }).filter(Boolean) as string[];

      if (paths.length) {
        await storageManager.delete(paths);
      }
    } catch (error) {
      console.error('Storage deletion error:', error);
      return Response.json(
        { error: error instanceof Error ? error.message : "Failed to delete media" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to delete media";
    return Response.json({ error: message }, { status: 500 });
  }
}
