import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { getAuthToken } from "@/store/auth";

export async function uploadToStorage(
  slug: string,
  file: File,
  userId: string
): Promise<{ publicUrl: string; path: string; type: "image" | "video" }> {
  const authToken = getAuthToken();

  // Use FormData for unified upload (Cloudinary)
  const formData = new FormData();
  formData.append('file', file);
  formData.append('slug', slug);
  formData.append('userId', userId);

  const res = await fetch(CONTENT_API_ROUTES.upload, {
    method: "POST",
    headers: {
      ...(authToken && { "Authorization": `Bearer ${authToken}` })
    },
    body: formData,
  });

  if (!res.ok) throw new Error("Failed to upload file");
  const result = await res.json();

  const type: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
  return { publicUrl: result.publicUrl, path: result.path, type };
}
