import { useEffect, useState } from "react";
import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { useAppSelector } from "@/store";
import { Brand } from "@/store/content";

interface BrandWithProject extends Brand {
  projectSlug: string;
  projectName: string;
}

export function useFetchAllBrands() {
  const [data, setData] = useState<BrandWithProject[]>([]);
  const [loading, setLoading] = useState(false);
  const { uid } = useAppSelector((s) => s.auth);
  const userId = uid ?? process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? "";

  const fetchBrands = () => {
    if (!userId) return;
    setLoading(true);
    fetch(CONTENT_API_ROUTES.allBrands(userId))
      .then((res) => res.json())
      .then((result) => {
        if (Array.isArray(result)) setData(result);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBrands();
  }, [userId]);

  return { data, loading, refetch: fetchBrands };
}
