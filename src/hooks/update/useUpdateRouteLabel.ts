import { useState } from "react";
import { API_ROUTES } from "@/routeConfig/apiRoutes";

export function useUpdateRouteLabel(routeId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateRoute = async (data: Record<string, unknown>) => {
    setLoading(true);
    setError("");
    const res = await fetch(API_ROUTES.update(routeId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
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
