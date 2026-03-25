import { useEffect, useState } from "react";
import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { Brand } from "@/store/content";

interface BrandWithProject extends Brand {
  projectSlug: string;
  projectName: string;
}

export function useFetchAllBrands() {
  const [data, setData] = useState<BrandWithProject[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBrands = () => {
    setLoading(true);
    fetch(CONTENT_API_ROUTES.allBrands)
      .then((res) => res.json())
      .then((result) => {
        if (Array.isArray(result)) setData(result);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  return { data, loading, refetch: fetchBrands };
}
