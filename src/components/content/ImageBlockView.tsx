"use client";

import { useState } from "react";
import { ContentBlock, MediaItem, Brand } from "@/store/content";
import { useModal } from "@/components/common/useModal";
import MediaCaption from "./MediaCaption";
import VideoPlayer from "./VideoPlayer";

interface Props {
  block: ContentBlock;
  brands?: Brand[];
}

export default function ImageBlockView({ block, brands }: Props) {
  const media = block.media ?? [];
  const isHalf = block.layout === "half";
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);

  const [previewModal, renderPreviewModal] = useModal({ title: "Preview" });

  const handlePreview = (item: MediaItem) => {
    if (item.type === "video") return;
    setPreviewItem(item);
    previewModal.open();
  };

  const getBrand = (item: MediaItem) =>
    item.brandId ? brands?.find((b) => b.id === item.brandId) : undefined;

  return (
    <>
      <div
        className={`grid gap-4 grid-cols-1 ${isHalf ? "md:grid-cols-2" : ""}`}
      >
        {media.map((item, i) => (
          <div key={i} className="flex flex-col gap-1">
            <div
              className={`relative aspect-video overflow-hidden w-full ${isHalf ? "max-h-[400px]" : ""} ${item.type === "image" ? "cursor-pointer" : ""}`}
              onClick={() => handlePreview(item)}
            >
              {item.type === "video" ? (
                <VideoPlayer src={item.url} className="w-full h-full" />
              ) : (
                <img
                  src={item.url}
                  alt={item.title ?? ""}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            {(item.title || item.date || item.brandId || (item.type === "video" && item.duration)) && (
              <MediaCaption item={item} brand={getBrand(item)} />
            )}
          </div>
        ))}
        {isHalf && media.length === 1 && (
          <div className="hidden md:block aspect-video max-h-[400px]" />
        )}
      </div>

      {renderPreviewModal(
        previewItem && (
          <div className="flex flex-col items-center gap-4">
            <img
              src={previewItem.url}
              alt={previewItem.title ?? ""}
              className="max-w-full max-h-[70vh] object-contain"
            />
            {(previewItem.title || previewItem.date || previewItem.brandId) && (
              <MediaCaption item={previewItem} brand={getBrand(previewItem)} />
            )}
          </div>
        ),
        { size: "xl" }
      )}
    </>
  );
}
