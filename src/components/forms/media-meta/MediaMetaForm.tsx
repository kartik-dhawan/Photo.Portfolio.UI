"use client";

import { MutableRefObject, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { MediaItem, Brand } from "@/store/content";
import {
  mediaMetaSchema,
  MediaMetaFormValues,
  formatDuration,
  parseDuration,
} from "./schema";
import ExistingMediaPicker from "@/components/content/ExistingMediaPicker";
import { uploadToStorage } from "@/lib/upload";

interface Props {
  item: MediaItem;
  brands?: Brand[];
  onSave: (data: Partial<Pick<MediaItem, "title" | "date" | "duration" | "link" | "brandId" | "thumbnailUrl">>) => void;
  saveRef: MutableRefObject<(() => void) | null>;
  showThumbnail?: boolean;
  slug?: string;
  userId?: string;
}

export default function MediaMetaForm({ item, brands, onSave, saveRef, showThumbnail, slug, userId }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<MediaMetaFormValues>({
    resolver: yupResolver(mediaMetaSchema),
    defaultValues: {
      title: item.title ?? "",
      date: item.date ?? "",
      duration: item.duration != null ? formatDuration(item.duration) : "",
      link: item.link ?? "",
      brandId: item.brandId ?? "",
    },
  });

  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>(item.thumbnailUrl);
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onSubmit = (data: MediaMetaFormValues) => {
    onSave({
      title: data.title || undefined,
      date: data.date || undefined,
      duration: parseDuration(data.duration) || undefined,
      link: data.link || undefined,
      brandId: data.brandId || undefined,
      ...(showThumbnail ? { thumbnailUrl: thumbnailUrl || undefined } : {}),
    });
  };

  useEffect(() => {
    saveRef.current = handleSubmit(onSubmit);
    return () => {
      saveRef.current = null;
    };
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !slug || !userId) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { publicUrl } = await uploadToStorage(slug, file, userId);
      setThumbnailUrl(publicUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const handlePickerSelect = (url: string, type: "image" | "video") => {
    if (type !== "image") return;
    setThumbnailUrl(url);
    setShowPicker(false);
  };

  const inputClass =
    "bg-transparent border border-zinc-800 rounded px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700";

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Title
        </span>
        <input
          type="text"
          {...register("title")}
          placeholder="e.g. Golden Hour Portrait"
          className={inputClass}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Date Captured
        </span>
        <input
          type="date"
          {...register("date")}
          className={`${inputClass} [color-scheme:dark]`}
        />
      </label>

      {item.type === "video" && (
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Duration (e.g. 1m 30s)
          </span>
          <input
            type="text"
            {...register("duration")}
            placeholder="e.g. 1m 30s"
            className={inputClass}
          />
        </label>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Link (optional)
        </span>
        <input
          type="url"
          {...register("link")}
          placeholder="https://..."
          className={inputClass}
        />
        {errors.link && (
          <span className="text-red-500 text-[10px]">{errors.link.message}</span>
        )}
      </label>

      {brands && brands.length > 0 && (
        <label className="flex flex-col gap-1">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Brand
          </span>
          <select
            {...register("brandId")}
            className={`${inputClass} [color-scheme:dark]`}
          >
            <option value="">None</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}

      {showThumbnail && (
        <div className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Thumbnail (optional)
          </span>

          {thumbnailUrl ? (
            <div className="flex items-start gap-3">
              <img
                src={thumbnailUrl}
                alt=""
                className="w-16 h-16 object-cover rounded border border-zinc-700 shrink-0"
              />
              <button
                type="button"
                onClick={() => setThumbnailUrl(undefined)}
                className="text-zinc-500 hover:text-red-400 text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => { setShowPicker(false); fileRef.current?.click(); }}
                disabled={uploading}
                className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 rounded px-3 py-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {uploading ? "Uploading…" : "↑ Upload new"}
              </button>
              <button
                type="button"
                onClick={() => setShowPicker((v) => !v)}
                className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 rounded px-3 py-1.5 transition-colors cursor-pointer"
              >
                {showPicker ? "Cancel" : "Choose existing"}
              </button>
            </div>
          )}

          {uploadError && (
            <span className="text-red-500 text-[10px]">{uploadError}</span>
          )}

          {showPicker && (
            <div className="border border-zinc-800 rounded overflow-y-auto max-h-60">
              <div className="p-3">
                <ExistingMediaPicker onSelect={handlePickerSelect} />
              </div>
            </div>
          )}
        </div>
      )}
    </form>
  );
}
