"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { CollectionItem, CollectionsResponse } from "@/store/content/types";
import CollectionCard from "./CollectionCard";
import Skeleton from "@/components/common/Skeleton";

interface Props {
  initialItems: CollectionItem[];
  total: number;
  pageSize: number;
}

export default function CollectionsGrid({ initialItems, total, pageSize }: Props) {
  const [items, setItems] = useState(initialItems);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialItems.length < total);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const nextPage = page + 1;
    try {
      const res = await fetch(
        `${CONTENT_API_ROUTES.collections}?page=${nextPage}&pageSize=${pageSize}`
      );
      const data: CollectionsResponse = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setHasMore(data.hasMore);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, pageSize]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchMore();
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchMore]);

  return (
    <div className="flex flex-col gap-6">
      <div className="columns-2 md:columns-3 xl:columns-4 gap-4">
        {items.map((item, i) => (
          <CollectionCard key={`${item.url}-${i}`} item={item} />
        ))}
        {loading &&
          Array.from({ length: 8 }).map((_, i) => (
            <div key={`skeleton-${i}`} className="break-inside-avoid mb-4">
              <Skeleton
                className="w-full rounded bg-zinc-900"
                style={{ aspectRatio: `1 / ${[0.75, 0.8, 1, 1.25, 1.33][i % 5]}` }}
              />
            </div>
          ))}
      </div>

      {hasMore && <div ref={sentinelRef} className="h-1" />}

      {!hasMore && items.length > 0 && (
        <p className="text-zinc-700 text-xs font-mono text-center py-4">
          {total} images
        </p>
      )}
    </div>
  );
}
