"use client";

import { MutableRefObject, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { MediaItem, Brand } from "@/store/content";
import {
  mediaMetaSchema,
  MediaMetaFormValues,
  formatDuration,
  parseDuration,
} from "./schema";

interface Props {
  item: MediaItem;
  brands?: Brand[];
  onSave: (data: Pick<MediaItem, "title" | "date" | "duration" | "link" | "brandId">) => void;
  saveRef: MutableRefObject<(() => void) | null>;
}

export default function MediaMetaForm({ item, brands, onSave, saveRef }: Props) {
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

  const onSubmit = (data: MediaMetaFormValues) => {
    onSave({
      title: data.title || undefined,
      date: data.date || undefined,
      duration: parseDuration(data.duration) || undefined,
      link: data.link || undefined,
      brandId: data.brandId || undefined,
    });
  };

  useEffect(() => {
    saveRef.current = handleSubmit(onSubmit);
    return () => {
      saveRef.current = null;
    };
  });

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
    </form>
  );
}
