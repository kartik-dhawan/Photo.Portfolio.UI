import { useState } from "react";
import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { Brand, SectionNames } from "@/store/content";
import { getAuthToken } from "@/store/auth";

interface PageSettings {
  brands: Brand[];
  tags: string[];
  filmedAt: string;
  sectionNames?: SectionNames;
}

export function useUpdatePageSettings(slug: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateSettings = async (settings: PageSettings) => {
    setLoading(true);
    setError("");
    const token = getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(CONTENT_API_ROUTES.settings(slug), {
      method: "PATCH",
      headers,
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
