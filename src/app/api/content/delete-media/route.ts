import { verifyAuth } from "@/lib/auth";
import { getAdminDb } from "@/firebase/admin";
import { v2 as cloudinary } from "cloudinary";
import { ContentBlock, MediaItem } from "@/store/content/types";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

function parseCloudinaryUrl(
  url: string
): { publicId: string; resourceType: "image" | "video" | "raw" } | null {
  const m = url.match(/\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  if (!m) return null;
  return { resourceType: m[1] as "image" | "video" | "raw", publicId: m[2] };
}

function normalizeUrl(url: string): string {
  return url.replace(/\/upload\/v\d+\//, "/upload/");
}

// Scan every content doc and settings doc across ALL users to collect
// every Cloudinary URL that is currently in use.
async function getAllReferencedUrls(): Promise<Set<string>> {
  const db = getAdminDb();
  const [contentSnapshot, settingsSnapshot] = await Promise.all([
    db.collection("portfolio_content").get(),
    db.collection("portfolio_settings").get(),
  ]);

  const refs = new Set<string>();

  for (const doc of contentSnapshot.docs) {
    const data = doc.data();
    for (const block of (data.blocks ?? []) as ContentBlock[]) {
      for (const media of (block.media ?? []) as MediaItem[]) {
        if (media.url?.startsWith("http")) refs.add(normalizeUrl(media.url));
      }
    }
    for (const brand of (data.brands ?? []) as { logoUrl?: string }[]) {
      if (brand.logoUrl?.startsWith("http")) refs.add(normalizeUrl(brand.logoUrl));
    }
  }

  for (const doc of settingsSnapshot.docs) {
    const url = (doc.data() as { profilePhotoUrl?: string }).profilePhotoUrl;
    if (url?.startsWith("http")) refs.add(normalizeUrl(url));
  }

  return refs;
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

    // Check which URLs are still referenced by ANYONE (any user, any page).
    // Called after the page save has already removed the reference for the
    // requesting user, so any URL still in the set belongs to someone else.
    const referencedUrls = await getAllReferencedUrls();

    const toDelete = urls.filter((url) => !referencedUrls.has(normalizeUrl(url)));
    const skipped = urls.length - toDelete.length;

    if (toDelete.length === 0) {
      return Response.json({ success: true, deleted: 0, skipped });
    }

    const byType: Record<string, string[]> = {};
    for (const url of toDelete) {
      const parsed = parseCloudinaryUrl(url);
      if (!parsed) continue;
      (byType[parsed.resourceType] ??= []).push(parsed.publicId);
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

    return Response.json({ success: true, deleted: toDelete.length, skipped });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to delete media";
    return Response.json({ error: message }, { status: 500 });
  }
}
