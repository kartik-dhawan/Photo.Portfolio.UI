import { verifyAuth } from "@/lib/auth";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// Extracts the public_id and resource_type from a Cloudinary secure_url.
// Handles the optional version segment (v1714000000/) that Cloudinary includes.
// e.g. https://res.cloudinary.com/x/image/upload/v123/photo-portfolio/uid/slug/abc.jpg
//   → { resourceType: 'image', publicId: 'photo-portfolio/uid/slug/abc' }
function parseCloudinaryUrl(
  url: string
): { publicId: string; resourceType: "image" | "video" | "raw" } | null {
  const m = url.match(/\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  if (!m) return null;
  return {
    resourceType: m[1] as "image" | "video" | "raw",
    publicId: m[2],
  };
}

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

    // Group public_ids by resource_type so we call delete_resources once per type
    const byType: Record<string, string[]> = {};
    for (const url of urls) {
      const parsed = parseCloudinaryUrl(url);
      if (!parsed) continue;
      const { resourceType, publicId } = parsed;
      (byType[resourceType] ??= []).push(publicId);
    }

    for (const [resourceType, publicIds] of Object.entries(byType)) {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: resourceType as "image" | "video" | "raw",
      });

      const failed = Object.entries(result.deleted ?? {})
        .filter(([, status]) => status !== "deleted")
        .map(([id]) => id);

      if (failed.length) {
        throw new Error(`Failed to delete from Cloudinary: ${failed.join(", ")}`);
      }
    }

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete media";
    return Response.json({ error: message }, { status: 500 });
  }
}
