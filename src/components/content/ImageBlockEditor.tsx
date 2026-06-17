"use client";

import { useRef, useState, useCallback } from "react";
import { ContentBlock, ImageLayout, AspectRatio, MediaItem, Brand } from "@/store/content";
import { useModal } from "@/components/common/useModal";
import MediaMetaForm from "@/components/forms/media-meta/MediaMetaForm";
import MediaCaption from "./MediaCaption";
import ExistingMediaPicker from "./ExistingMediaPicker";
import { FileUtils } from "@/lib/file-utils";

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
  const replaceFileRef = useRef<HTMLInputElement>(null);
  const media = block.media ?? [];
  const layout = block.layout ?? "full";
  const aspectRatio = block.aspectRatio ?? "16/9";
  const maxMedia = layout === "half" ? 2 : 1;
  const RATIOS: { value: AspectRatio; label: string }[] = [
    { value: "16/9", label: "16:9" },
    { value: "1/1", label: "1:1" },
    { value: "4/5", label: "4:5" },
    { value: "9/16", label: "9:16" },
  ];
  const [metaIndex, setMetaIndex] = useState<number>(-1);
  const metaSaveRef = useRef<(() => void) | null>(null);
  // null = add mode, number = replace mode (index of item to replace)
  const [pickerReplaceIndex, setPickerReplaceIndex] = useState<number | null>(null);

  const [metaModal, renderMetaModal] = useModal({ title: "Add Meta Data" });
  const [pickerModal, renderPickerModal] = useModal({ title: "Choose Existing Media" });

  const addFile = (file: File): MediaItem => {
    const validation = FileUtils.validateFile(file);
    if (!validation.isValid) {
      alert(validation.error!);
      throw new Error(validation.error!);
    }
    const blobUrl = URL.createObjectURL(file);
    const mediaType = file.type.startsWith("video/") ? "video" : "image";
    onFileAdd(blobUrl, file);
    return { url: blobUrl, type: mediaType } as MediaItem;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = FileUtils.validateFile(file);
    if (!validation.isValid) {
      alert(validation.error!);
      e.target.value = "";
      return;
    }
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
      const validation = FileUtils.validateFile(file);
      if (!validation.isValid) {
        alert(validation.error!);
        return;
      }
      const oldUrl = media[index]?.url;
      if (oldUrl) onFileRemove(oldUrl);
      const item = addFile(file);
      const newMedia = [...media];
      newMedia[index] = item;
      onChange({ media: newMedia });
    };
    input.click();
  };

  const handleOpenPicker = (replaceIndex: number | null) => {
    setPickerReplaceIndex(replaceIndex);
    pickerModal.open();
  };

  const handlePickerSelect = useCallback(
    (url: string, type: "image" | "video") => {
      const item: MediaItem = { url, type };
      if (pickerReplaceIndex !== null) {
        const oldUrl = media[pickerReplaceIndex]?.url;
        if (oldUrl) onFileRemove(oldUrl);
        const newMedia = [...media];
        newMedia[pickerReplaceIndex] = item;
        onChange({ media: newMedia });
      } else {
        onChange({ media: [...media, item].slice(0, maxMedia) });
      }
      pickerModal.close();
    },
    [pickerReplaceIndex, media, onChange, onFileRemove, maxMedia, pickerModal]
  );

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
    onChange({
      layout: next,
      media: trimmed,
      aspectRatio: next === "full" ? undefined : aspectRatio,
    });
  };

  const btnClass =
    "text-[10px] uppercase tracking-wider text-zinc-500 hover:text-white transition-colors cursor-pointer border border-zinc-800 rounded px-2 py-1";

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={toggleLayout} className={btnClass}>
          Layout: {layout === "full" ? "1fr" : "1fr 1fr"}
        </button>
        {layout === "half" && (
          <div className="flex items-center gap-1">
            {RATIOS.map((r) => (
              <button
                key={r.value}
                onClick={() => onChange({ aspectRatio: r.value })}
                className={`text-[10px] uppercase tracking-wider transition-colors cursor-pointer border rounded px-2 py-1 ${
                  aspectRatio === r.value
                    ? "text-white border-zinc-600"
                    : "text-zinc-600 border-zinc-800 hover:text-zinc-400"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}
        {media.length < maxMedia && (
          <>
            <button onClick={() => fileRef.current?.click()} className={btnClass}>
              + Upload
            </button>
            <button onClick={() => handleOpenPicker(null)} className={btnClass}>
              + Choose Existing
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
        style={{ gridTemplateColumns: layout === "half" ? "1fr 1fr" : "1fr" }}
      >
        {Array.from({ length: layout === "half" ? 2 : 1 }).map((_, i) => {
          const item = media[i];
          if (!item) {
            return (
              <div
                key={i}
                className="max-h-[400px] border border-dashed border-zinc-800 rounded flex items-center justify-center text-zinc-700 text-xs"
                style={{ aspectRatio: layout === "half" ? aspectRatio : "16/9" }}
              >
                Empty
              </div>
            );
          }
          return (
            <div key={i} className="flex flex-col gap-1">
              <div
                className="relative group overflow-hidden"
                style={{ aspectRatio: layout === "half" ? aspectRatio : "16/9" }}
              >
                {item.type === "video" ? (
                  <video src={item.url} controls className="w-full h-full object-cover rounded" />
                ) : (
                  <img src={item.url} alt="" className="w-full h-full object-cover rounded" />
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
                    Upload
                  </button>
                  <button
                    onClick={() => handleOpenPicker(i)}
                    className="bg-black/70 text-white text-[10px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer hover:bg-black transition-colors"
                  >
                    Pick
                  </button>
                  <button
                    onClick={() => handleRemove(i)}
                    className="bg-black/70 text-red-400 text-[10px] uppercase tracking-wider px-2 py-1 rounded cursor-pointer hover:bg-black transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
              {(item.title || item.date) && <MediaCaption item={item} />}
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
          okButtonProps: { label: "Save", onClick: () => metaSaveRef.current?.() },
          cancelButtonProps: { label: "Cancel", onClick: () => metaModal.close() },
        }
      )}

      {renderPickerModal(<ExistingMediaPicker onSelect={handlePickerSelect} />, {
        size: "xl",
        cancelButtonProps: { label: "Cancel", onClick: () => pickerModal.close() },
      })}
    </div>
  );
}
