"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAppSelector } from "@/store";
import { getAuthToken } from "@/store/auth/slice";
import { useState } from "react";
import { userSettingsSchema, UserSettingsFormValues } from "./schema";

interface Props {
  userId: string;
  defaultValues: UserSettingsFormValues;
  onSaved?: () => void;
}

export default function UserSettingsForm({ userId, defaultValues, onSaved }: Props) {
  const { role } = useAppSelector((s) => s.auth);
  const isSuperAdmin = role === "superAdmin";
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<UserSettingsFormValues>({
    resolver: yupResolver(userSettingsSchema),
    defaultValues,
  });

  const onSubmit = async (data: UserSettingsFormValues) => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const token = getAuthToken();
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess(true);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "bg-transparent border border-zinc-800 rounded px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700 w-full";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5 max-w-xl">
      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Display Name *
        </label>
        <input {...register("displayName")} className={inputClass} placeholder="Your Name" />
        {errors.displayName && (
          <span className="text-red-500 text-[10px]">{errors.displayName.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Tagline
        </label>
        <input {...register("tagline")} className={inputClass} placeholder="Photographer & Videographer" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Hero Title
        </label>
        <input {...register("heroTitle")} className={inputClass} placeholder="Shown on your home page" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Hero Subtitle
        </label>
        <input {...register("heroSubtitle")} className={inputClass} placeholder="Subtitle below hero" />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          About Text
        </label>
        <textarea
          {...register("aboutText")}
          rows={5}
          className={`${inputClass} resize-none`}
          placeholder="Separate paragraphs with blank lines"
        />
      </div>

      {isSuperAdmin && (
        <div className="flex flex-col gap-2 border-t border-zinc-800 pt-4">
          <label className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Custom Domain (Super Admin only)
          </label>
          <input
            {...register("customDomain")}
            className={inputClass}
            placeholder="e.g. johndoe.com"
          />
        </div>
      )}

      {error && <span className="text-red-500 text-[10px]">{error}</span>}
      {success && <span className="text-green-500 text-[10px]">Saved successfully</span>}

      <button
        type="submit"
        disabled={saving || !isDirty}
        className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 rounded px-4 py-2 transition-colors cursor-pointer self-start disabled:opacity-40"
      >
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </form>
  );
}
