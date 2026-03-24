"use client";

import { useRef, useState, useCallback } from "react";
import { ContentBlock, ImageLayout, MediaItem, Brand } from "@/store/content";
import { useModal } from "@/components/common/useModal";
import MediaMetaForm from "@/components/forms/media-meta/MediaMetaForm";
import MediaCaption from "./MediaCaption";

interface Props {
  block: ContentBlock;
  slug: string;
  brands?: Brand[];
  onChange: (data: Partial<ContentBlock>) => void;
  onFileAdd: (blobUrl: string, file: File) => void;
  onFileRemove: (blobUrl: string) => void;
}

export default function ImageBlockEditor({
  block,
  slug,
  brands,
  onChange,
  onFileAdd,
  onFileRemove,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const media = block.media ?? [];
  const layout = block.layout ?? "full";
  const maxMedia = layout === "half" ? 2 : 1;
  const [metaIndex, setMetaIndex] = useState<number>(-1);
  const metaSaveRef = useRef<(() => void) | null>(null);

  const [metaModal, renderMetaModal] = useModal({ title: "Add Meta Data" });

  const addFile = (file: File): MediaItem => {
    const blobUrl = URL.createObjectURL(file);
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    onFileAdd(blobUrl, file);
    return { url: blobUrl, type: mediaType } as MediaItem;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const item = addFile(file);
    onChange({ media: [...media, item].slice(0, maxMedia) });
    e.target.value = "";
  };

  const handleRemove = (index: number) => {
    const removed = media[index];
    if (removed?.url) onFileRemove(removed.url);
    onChange({ media: media.filter((_, i) => i !== index) });
  };

  const handleReplace = (index: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*,video/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const oldUrl = media[index]?.url;
      if (oldUrl) onFileRemove(oldUrl);
      const item = addFile(file);
      const newMedia = [...media];
      newMedia[index] = item;
      onChange({ media: newMedia });
    };
    input.click();
  };

  const handleOpenMeta = (index: number) => {
    setMetaIndex(index);
    metaModal.open();
  };

  const handleSaveMeta = useCallback(
    (data: Pick<MediaItem, "title" | "date" | "duration">) => {
      const newMedia = [...media];
      newMedia[metaIndex] = { ...newMedia[metaIndex], ...data };
      onChange({ media: newMedia });
      metaModal.close();
    },
    [media, metaIndex, onChange, metaModal]
  );

  const toggleLayout = () => {
    const next: ImageLayout = layout === "full" ? "half" : "full";
    if (next === "full" && media.length > 1) {
      onFileRemove(media[1].url);
    }
    const trimmed = next === "full" ? media.slice(0, 1) : media;
    onChange({ layout: next, media: trimmed });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleLayout}
          className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-white transition-colors cursor-pointer border border-zinc-800 rounded px-2 py-1"
        >
          Layout: {layout === "full" ? "1fr" : "1fr 1fr"}
        </button>
        {media.length < maxMedia && (
          <>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-[10px] uppercase tracking-wider text-zinc-500 hover:text-white transition-colors cursor-pointer border border-zinc-800 rounded px-2 py-1"
            >
              + Add {media.length === 0 ? "Media" : "Second"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </>
        )}
      </div>

      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: layout === "half" ? "1fr 1fr" : "1fr",
        }}
      >
        {Array.from({ length: layout === "half" ? 2 : 1 }).map((_, i) => {
          const item = media[i];
          if (!item) {
            return (
              <div
                key={i}
                className="aspect-video max-h-[400px] border border-dashed border-zinc-800 rounded flex items-center justify-center text-zinc-700 text-xs"
              >
                Empty
              </div>
            );
          }
          return (
            <div key={i} className="flex flex-col gap-1">
              <div className="relative group aspect-video max-h-[400px] overflow-hidden">
                {item.type === "video" ? (
                  <video
                    src={item.url}
                    controls
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  <img
                    src={item.url}
                    alt=""
                    className="w-full h-full object-cover rounded"
                  />
                )}
                <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                  <button
                    onClick={() => handleOpenMeta(i)}
                    className="bg-black/70 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer hover:bg-black transition-colors"
                  >
                    Meta
                  </button>
                  <button
                    onClick={() => handleReplace(i)}
                    className="bg-black/70 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer hover:bg-black transition-colors"
                  >
                    Replace
                  </button>
                  <button
                    onClick={() => handleRemove(i)}
                    className="bg-black/70 text-red-400 text-[10px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer hover:bg-black transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {(item.title || item.date) && (
                <MediaCaption item={item} />
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
