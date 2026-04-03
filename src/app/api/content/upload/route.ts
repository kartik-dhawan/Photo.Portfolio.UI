import { getSupabaseAdmin } from "@/supabase/admin";
import { verifyAuth } from "@/lib/auth";

const BUCKET = "photo-portfolio";

export async function POST(request: Request) {
  try {
    const authUser = await verifyAuth(request);
    if (!authUser) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug, fileName, contentType, userId } = await request.json();

    if (!slug || !fileName) {
      return Response.json(
        { error: "slug and fileName are required" },
        { status: 400 }
      );
    }

    // Use provided userId (for superAdmin acting on behalf) or auth user's uid
    const targetUserId = userId ?? authUser.uid;

    const ext = fileName.split(".").pop() || "bin";
    const path = `${targetUserId}/${slug}/${Date.now()}.${ext}`;

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUploadUrl(path);

    if (error || !data) {
      return Response.json(
        { error: error?.message || "Failed to create upload URL" },
        { status: 500 }
      );
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(path);

    const mediaType = contentType?.startsWith("video/") ? "video" : "image";

    return Response.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path,
      publicUrl: publicUrlData.publicUrl,
      type: mediaType,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to create upload URL";
    return Response.json({ error: message }, { status: 500 });
  }
}
