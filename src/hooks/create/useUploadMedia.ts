import { useState } from "react";
import { uploadToStorage } from "@/lib/upload";

export function useUploadMedia(slug: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const upload = async (file: File) => {
    setLoading(true);
    setError("");
    try {
      return await uploadToStorage(slug, file);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { upload, loading, error };
}
