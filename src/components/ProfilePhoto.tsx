"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useAppSelector } from "@/store";
import { uploadToStorage } from "@/lib/upload";

interface Props {
  initialUrl: string;
}

export default function ProfilePhoto({ initialUrl }: Props) {
  const { isAdmin } = useAppSelector((s) => s.auth);
  const [photoUrl, setPhotoUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { publicUrl } = await uploadToStorage("profile", file);
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhotoUrl: publicUrl }),
      });
      setPhotoUrl(publicUrl);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div
      className={`relative w-full aspect-video overflow-hidden rounded border border-zinc-800 bg-zinc-900 ${
        isAdmin ? "cursor-pointer hover:border-zinc-600 transition-colors" : ""
      } ${uploading ? "opacity-50 animate-pulse" : ""}`}
      onClick={() => isAdmin && fileRef.current?.click()}
    >
      {photoUrl ? (
        <Image
          src={photoUrl}
          alt="Profile"
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-zinc-800"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )}
      {isAdmin && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />
      )}
    </div>
  );
}
