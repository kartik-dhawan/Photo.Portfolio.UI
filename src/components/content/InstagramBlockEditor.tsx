"use client";

import { useRef, useState, useCallback } from "react";
import { ContentBlock, ImageLayout, MediaItem, Brand } from "@/store/content";
import { useModal } from "@/components/common/useModal";
import MediaMetaForm from "@/components/forms/media-meta/MediaMetaForm";
import MediaCaption from "./MediaCaption";

function extractPostUrl(url: string): string | null {
  const match = url.match(
    /(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels)\/[A-Za-z0-9_-]+)/
  );
  return match?.[1] ?? null;
}

interface Props {
  block: ContentBlock;
  brands?: Brand[];
  onChange: (data: Partial<ContentBlock>) => void;
}

export default function InstagramBlockEditor({ block, brands, onChange }: Props) {
  const media = block.media ?? [];
  const layout = block.layout ?? "full";
  const maxMedia = layout === "third" ? 3 : layout === "half" ? 2 : 1;
  const [metaIndex, setMetaIndex] = useState(-1);
  const metaSaveRef = useRef<(() => void) | null>(null);

  const [metaModal, renderMetaModal] = useModal({ title: "Add Meta Data" });

  const handleUrlChange = (index: number, value: string) => {
    const newMedia = [...media];
    newMedia[index] = { ...newMedia[index], url: value };
    onChange({ media: newMedia });
  };

  const handleAdd = () => {
    onChange({ media: [...media, { url: "", type: "image" as const }] });
  };

  const handleRemove = (index: number) => {
    onChange({ media: media.filter((_, i) => i !== index) });
  };

  const cycleLayout = () => {
    const layouts: ImageLayout[] = ["full", "half", "third"];
    const idx = layouts.indexOf(layout);
    const next = layouts[(idx + 1) % layouts.length];
    const trimmed = media.slice(0, next === "third" ? 3 : next === "half" ? 2 : 1);
    onChange({ layout: next, media: trimmed });
  };

  const layoutLabel = layout === "third" ? "1fr 1fr 1fr" : layout === "half" ? "1fr 1fr" : "1fr";

  const handleOpenMeta = (index: number) => {
    setMetaIndex(index);
    metaModal.open();
  };

  const handleSaveMeta = useCallback(
    (data: Partial<MediaItem>) => {
      const newMedia = [...media];
      newMedia[metaIndex] = { ...newMedia[metaIndex], ...data };
      onChange({ media: newMedia });
      metaModal.close();
    },
    [media, metaIndex, onChange, metaModal]
  );

  const colStyle =
    layout === "third"
      ? "1fr 1fr 1fr"
      : layout === "half"
        ? "1fr 1fr"
        : "1fr";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={cycleLayout}
          className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-white transition-colors cursor-pointer border border-zinc-800 rounded px-2 py-1"
        >
          Layout: {layoutLabel}
        </button>
        {media.length < maxMedia && (
          <button
            onClick={handleAdd}
            className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-white transition-colors cursor-pointer border border-zinc-800 rounded px-2 py-1"
          >
            + Add {media.length === 0 ? "Post" : "More"}
          </button>
        )}
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: colStyle }}
      >
        {media.map((item, i) => {
          const postUrl = extractPostUrl(item.url);
          return (
            <div key={i} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={item.url}
                  onChange={(e) => handleUrlChange(i, e.target.value)}
                  placeholder="Instagram post/reel URL"
                  className="flex-1 bg-transparent border border-zinc-800 rounded px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700"
                />
                <button
                  onClick={() => handleOpenMeta(i)}
                  className="text-zinc-600 hover:text-white text-[10px] uppercase tracking-wider transition-colors cursor-pointer px-2"
                >
                  Meta
                </button>
                <button
                  onClick={() => handleRemove(i)}
                  className="text-zinc-600 hover:text-red-400 text-xs transition-colors cursor-pointer px-2"
                >
                  &times;
                </button>
              </div>
              {postUrl ? (
                <div className="flex items-center gap-2 border border-zinc-800 rounded px-3 py-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-zinc-400 shrink-0">
                    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6" />
                  </svg>
                  <a
                    href={postUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-400 hover:text-white text-xs font-mono transition-colors underline underline-offset-2 truncate"
                  >
                    {postUrl}
                  </a>
                </div>
              ) : (
                item.url && (
                  <p className="text-red-500 text-[10px]">
                    Invalid Instagram URL
                  </p>
                )
              )}
              {(item.title || item.date) && (
                <MediaCaption
                  item={item}
                  brand={
                    item.brandId
                      ? brands?.find((b) => b.id === item.brandId)
                      : undefined
                  }
                />
              )}
            </div>
          );
        })}
      </div>

      {renderMetaModal(
        metaIndex >= 0 && media[metaIndex] ? (
          <MediaMetaForm
            key={metaIndex}
            item={media[metaIndex]}
            brands={brands}
            onSave={handleSaveMeta}
            saveRef={metaSaveRef}
          />
        ) : null,
        {
          size: "sm",
          okButtonProps: {
            label: "Save",
            onClick: () => metaSaveRef.current?.(),
          },
          cancelButtonProps: {
            label: "Cancel",
            onClick: () => metaModal.close(),
          },
        }
      )}
    </div>
  );
}
