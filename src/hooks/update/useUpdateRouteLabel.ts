import { useState } from "react";
import { API_ROUTES } from "@/routeConfig/apiRoutes";

export function useUpdateRouteLabel(routeId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateLabel = async (label: string) => {
    setLoading(true);
    setError("");
    const res = await fetch(API_ROUTES.update(routeId), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label }),
    });
    setLoading(false);
    if (!res.ok) {
      const msg = "Failed to update label";
      setError(msg);
      throw new Error(msg);
    }
  };

  return { updateLabel, loading, error };
}
