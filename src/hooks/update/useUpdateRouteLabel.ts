import { useState } from "react";
import { API_ROUTES } from "@/routeConfig/apiRoutes";
import { getAuthToken } from "@/store/auth";

export function useUpdateRouteLabel(routeId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateRoute = async (data: Record<string, unknown>) => {
    setLoading(true);
    setError("");
    const token = getAuthToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(API_ROUTES.update(routeId), {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });
    setLoading(false);
    if (!res.ok) {
      const msg = "Failed to update route";
      setError(msg);
      throw new Error(msg);
    }
  };

  return { updateRoute, loading, error };
}
