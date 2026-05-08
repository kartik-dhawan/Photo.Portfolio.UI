import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { getAuthToken } from "@/store/auth";

export async function uploadToStorage(
  slug: string,
  file: File,
  userId: string
): Promise<{ publicUrl: string; path: string; type: "image" | "video" }> {
  const authToken = getAuthToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  // For Cloudinary, upload directly to API route that handles server-side upload
  if (process.env.STORAGE_PROVIDER === 'cloudinary') {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('slug', slug);
    formData.append('userId', userId);

    const res = await fetch('/api/content/upload-direct', {
      method: "POST",
      headers: {
        ...(authToken && { "Authorization": `Bearer ${authToken}` })
      },
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to upload file");
    return await res.json();
  }

  // For Supabase, maintain existing flow
  const res = await fetch(CONTENT_API_ROUTES.upload, {
    method: "POST",
    headers,
    body: JSON.stringify({
      slug,
      fileName: file.name,
      contentType: file.type,
    }),
  });

  if (!res.ok) throw new Error("Failed to get upload URL");
  const { path, token, publicUrl } = await res.json();

  const type: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
  return { publicUrl, path, type };
}
