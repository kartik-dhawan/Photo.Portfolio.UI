"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAppSelector } from "@/store";
import { getAuthToken } from "@/store/auth/slice";
import { SOCIAL_PLATFORMS } from "@/lib/socialPlatforms";
import { socialLinksSchema, SocialLinksFormValues } from "./schema";
import { buildSocialLinks } from "@/lib/socialPlatforms";

interface Props {
  userId: string;
  defaultValues: SocialLinksFormValues;
  onSaved?: () => void;
}

export default function SocialLinksForm({ userId, defaultValues, onSaved }: Props) {
  const { isAuthenticated, uid, role } = useAppSelector((s) => s.auth);
  const canEdit = isAuthenticated && (role === "superAdmin" || uid === userId);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { isDirty },
  } = useForm<SocialLinksFormValues>({
    resolver: yupResolver(socialLinksSchema),
    defaultValues,
  });

  if (!canEdit) return null;

  const onSubmit = async (data: SocialLinksFormValues) => {
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const token = getAuthToken();
      const socials = buildSocialLinks(data as Record<string, string>);
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ socials, socialHandles: data }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setSuccess(true);
      if (onSaved) {
        onSaved();
      } else {
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "bg-transparent border border-zinc-800 rounded-r px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700 flex-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <h3 className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
        Social Links
      </h3>

      {SOCIAL_PLATFORMS.map((platform) => (
        <div key={platform.id} className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-0">
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 border-r-0 rounded-l px-3 py-2 shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="text-zinc-500 shrink-0"
              >
                <path d={platform.icon} />
              </svg>
              <span className="text-zinc-500 text-sm font-mono">@</span>
            </div>
            <input
              {...register(platform.id as keyof SocialLinksFormValues)}
              type="text"
              placeholder={platform.name}
              className={inputClass}
            />
          </div>
          <input
            {...register(`${platform.id}_followers` as keyof SocialLinksFormValues)}
            type="text"
            placeholder="Followers"
            className="bg-transparent border border-zinc-800 rounded px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700"
          />
        </div>
      ))}

      {error && <span className="text-red-500 text-[10px]">{error}</span>}
      {success && <span className="text-green-500 text-[10px]">Saved</span>}

      <button
        type="submit"
        disabled={saving || !isDirty}
        className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 rounded px-4 py-2 transition-colors cursor-pointer self-start disabled:opacity-40"
      >
        {saving ? "Saving..." : "Save Social Links"}
      </button>
    </form>
  );
}
