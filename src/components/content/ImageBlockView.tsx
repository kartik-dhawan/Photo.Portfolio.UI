"use client";

import { useState } from "react";
import Image from "next/image";
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
  const ratio = isHalf && block.aspectRatio ? block.aspectRatio : "16/9";
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
              className={`relative overflow-hidden w-full ${""} ${item.type === "image" ? "cursor-pointer" : ""}`}
              style={{ aspectRatio: ratio }}
              onClick={() => handlePreview(item)}
            >
              {item.type === "video" ? (
                <VideoPlayer src={item.url} className="w-full h-full" />
              ) : (
                <Image
                  src={item.url}
                  alt={item.title ?? ""}
                  fill
                  sizes={isHalf ? "(max-width: 768px) 50vw, 100vw" : "(max-width: 768px) 100vw, 80vw"}
                  className="object-cover"
                  loading={i === 0 ? "eager" : "lazy"}
                  priority={i === 0}
                  quality={80}
                  placeholder="blur"
                  blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3CudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTgxODE4Ii8+PC9zdmc+"
                />
              )}
            </div>
            {(item.title || item.date || item.brandId || (item.type === "video" && item.duration)) && (
              <MediaCaption item={item} brand={getBrand(item)} />
            )}
          </div>
        ))}
        {isHalf && media.length === 1 && (
          <div className="hidden md:block" style={{ aspectRatio: ratio }} />
        )}
      </div>

      {renderPreviewModal(
        previewItem && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-full" style={{ maxHeight: "70vh", aspectRatio: "16/9" }}>
              <Image
                src={previewItem.url}
                alt={previewItem.title ?? ""}
                fill
                sizes="90vw"
                className="object-contain"
                quality={90}
                priority
              />
            </div>
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
