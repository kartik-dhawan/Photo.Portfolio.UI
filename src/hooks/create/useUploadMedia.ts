import { useState } from "react";
import { uploadToStorage } from "@/lib/upload";
import { useAppSelector } from "@/store";

export function useUploadMedia(slug: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { uid } = useAppSelector((state) => state.auth);

  const upload = async (file: File) => {
    if (!uid) {
      setError("User not authenticated");
      throw new Error("User not authenticated");
    }

    setLoading(true);
    setError("");
    try {
      return await uploadToStorage(slug, file, uid);
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
