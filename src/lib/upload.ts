import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { getAuthToken } from "@/store/auth";

type CloudinaryDirectUploadResult = {
  secure_url: string;
  folder?: string;
  public_id?: string;
  format?: string;
  error?: { message?: string } | string;
};

export async function uploadToStorage(
  slug: string,
  file: File,
  userId: string
): Promise<{ publicUrl: string; path: string; type: "image" | "video" }> {
  const authToken = getAuthToken();

  const sigRes = await fetch(CONTENT_API_ROUTES.uploadSignature, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken && { Authorization: `Bearer ${authToken}` }),
    },
    body: JSON.stringify({
      slug,
      userId,
      fileSize: file.size,
      mimeType: file.type,
    }),
  });

  if (!sigRes.ok) {
    const err = (await sigRes.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      typeof err.error === "string" ? err.error : "Failed to start upload"
    );
  }

  const sig = (await sigRes.json()) as {
    uploadUrl: string;
    api_key: string;
    signature: string;
    timestamp: number;
    folder: string;
    public_id: string;
  };

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.api_key);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);
  formData.append("public_id", sig.public_id);

  const uploadRes = await fetch(sig.uploadUrl, {
    method: "POST",
    body: formData,
  });

  const data = (await uploadRes.json()) as CloudinaryDirectUploadResult;

  if (!uploadRes.ok) {
    const raw = data?.error;
    const msg =
      typeof raw === "string"
        ? raw
        : typeof raw === "object" && raw?.message
          ? raw.message
          : "Upload failed";
    throw new Error(msg);
  }

  if (!data.secure_url || !data.public_id || !data.format) {
    throw new Error("Unexpected response from storage");
  }

  const type: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";

  const pid = String(data.public_id);
  const storedPath =
    data.folder && !pid.includes("/")
      ? `${data.folder}/${pid}.${data.format}`
      : `${pid}.${data.format}`;

  return {
    publicUrl: data.secure_url,
    path: storedPath,
    type,
  };
}
