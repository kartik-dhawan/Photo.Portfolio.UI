import { useState } from "react";
import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { Brand } from "@/store/content";

interface PageSettings {
  brands: Brand[];
  tags: string[];
  filmedAt: string;
}

export function useUpdatePageSettings(slug: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateSettings = async (settings: PageSettings) => {
    setLoading(true);
    setError("");
    const res = await fetch(CONTENT_API_ROUTES.settings(slug), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setLoading(false);
    if (!res.ok) {
      const msg = "Failed to save settings";
      setError(msg);
      throw new Error(msg);
    }
  };

  return { updateSettings, loading, error };
}
