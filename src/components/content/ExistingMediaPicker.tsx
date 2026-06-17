"use client";

import { useEffect, useState, useCallback } from "react";
import { getAuthToken } from "@/store/auth/slice";
import type { ShareableMediaItem } from "@/app/api/content/shareable-media/route";

function cloudinaryThumb(url: string): string {
  return url.replace("/upload/", "/upload/w_400,h_400,c_fill/");
}

function formatDay(isoDay: string): string {
  // Parse as noon UTC to avoid timezone-related off-by-one on the day
  return new Date(isoDay + "T12:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function groupByDay(items: ShareableMediaItem[]): { day: string; items: ShareableMediaItem[] }[] {
  const order: string[] = [];
  const map = new Map<string, ShareableMediaItem[]>();
  for (const item of items) {
    const day = item.contentDate.slice(0, 10);
    if (!map.has(day)) {
      order.push(day);
      map.set(day, []);
    }
    map.get(day)!.push(item);
  }
  return order.map((day) => ({ day, items: map.get(day)! }));
}

interface Props {
  onSelect: (url: string, type: "image" | "video") => void;
}

export default function ExistingMediaPicker({ onSelect }: Props) {
  const [filter, setFilter] = useState<"mine" | "all">("mine");
  const [items, setItems] = useState<ShareableMediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (f: "mine" | "all", p: number, reset: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      const res = await fetch(
        `/api/content/shareable-media?filter=${f}&page=${p}&pageSize=30`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (!res.ok) throw new Error("Failed to load images");
      const data = await res.json();
      setItems((prev) => (reset ? data.items : [...prev, ...data.items]));
      setHasMore(data.hasMore);
      setPage(p + 1);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(false);
    load(filter, 1, true);
  }, [filter, load]);

  const tabBtn = (active: boolean) =>
    `text-[10px] uppercase tracking-wider font-mono px-3 py-1 rounded border transition-colors cursor-pointer ${
      active
        ? "text-white border-zinc-600"
        : "text-zinc-500 border-zinc-800 hover:text-zinc-300"
    }`;

  const groups = groupByDay(items);

  return (
    <div className="flex flex-col gap-4">
      {/* Filter tabs */}
      <div className="flex gap-2">
        <button className={tabBtn(filter === "mine")} onClick={() => setFilter("mine")}>
          My Images
        </button>
        <button className={tabBtn(filter === "all")} onClick={() => setFilter("all")}>
          All Shareable
        </button>
      </div>

      {/* Empty state */}
      {items.length === 0 && !loading && !error && (
        <p className="text-zinc-600 text-xs font-mono text-center py-10">
          {filter === "mine"
            ? "No images uploaded yet."
            : "No shareable images from other users yet."}
        </p>
      )}

      {/* Date-grouped grid */}
      {groups.map(({ day, items: dayItems }) => (
        <div key={day} className="flex flex-col gap-2">
          {/* Date header */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider whitespace-nowrap">
              {formatDay(day)}
            </span>
            <div className="flex-1 h-px bg-zinc-800" />
          </div>

          {/* Grid for this day */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {dayItems.map((item) => (
              <button
                key={item.url}
                onClick={() => onSelect(item.url, item.type)}
                className="group flex flex-col gap-1 text-left cursor-pointer"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded border border-zinc-800 group-hover:border-zinc-500 transition-colors">
                  <img
                    src={cloudinaryThumb(item.url)}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = item.url;
                    }}
                  />
                  <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block" />
                </div>

                {/* Attribution */}
                <div className="px-0.5">
                  <p className="text-[10px] font-mono text-zinc-300 truncate leading-tight">
                    {item.projectName}
                  </p>
                  {!item.isOwnContent ? (
                    <p className="text-[9px] font-mono text-zinc-500 truncate leading-tight">
                      {item.ownerDisplayName
                        ? `${item.ownerDisplayName} · @${item.ownerUsername}`
                        : `@${item.ownerUsername}`}
                    </p>
                  ) : (
                    <p className="text-[9px] font-mono text-zinc-700 leading-tight">yours</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}

      {error && <p className="text-red-400 text-xs font-mono text-center">{error}</p>}

      {loading && (
        <p className="text-zinc-600 text-xs font-mono text-center">Loading...</p>
      )}

      {hasMore && !loading && (
        <button
          onClick={() => load(filter, page, false)}
          className="text-[10px] uppercase tracking-wider font-mono text-zinc-500 border border-zinc-800 hover:text-zinc-300 rounded px-3 py-1.5 transition-colors cursor-pointer self-center"
        >
          Load more
        </button>
      )}
    </div>
  );
}
