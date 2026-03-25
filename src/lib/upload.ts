import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { getSupabaseClient } from "@/supabase/client";

export async function uploadToStorage(
  slug: string,
  file: File
): Promise<{ publicUrl: string; path: string; type: "image" | "video" }> {
  const res = await fetch(CONTENT_API_ROUTES.upload, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      slug,
      fileName: file.name,
      contentType: file.type,
    }),
  });
  if (!res.ok) throw new Error("Failed to get upload URL");
  const { path, token, publicUrl } = await res.json();

  const supabase = getSupabaseClient();
  const { error } = await supabase.storage
    .from("photo-portfolio")
    .uploadToSignedUrl(path, token, file, {
      contentType: file.type,
      upsert: false,
    });
  if (error) throw new Error(error.message);

  const type: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
  return { publicUrl, path, type };
}
