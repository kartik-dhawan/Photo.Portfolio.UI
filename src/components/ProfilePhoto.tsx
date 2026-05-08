"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useAppSelector } from "@/store";
import { uploadToStorage } from "@/lib/upload";
import { getAuthToken } from "@/store/auth/slice";

interface Props {
  initialUrl: string;
}

export default function ProfilePhoto({ initialUrl }: Props) {
  const { isAuthenticated, uid, role } = useAppSelector((s) => s.auth);
  const isAdmin = isAuthenticated && (role === "superAdmin" || !!uid);
  const [photoUrl, setPhotoUrl] = useState(initialUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (profile photos are images)
    const maxSize = 10 * 1024 * 1024; // 10 MB for images
    if (file.size > maxSize) {
      const fileSizeMB = file.size / (1024 * 1024);
      alert(`Profile photo size (${fileSizeMB.toFixed(2)} MB) exceeds 10 MB limit. Please use a smaller image.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const { publicUrl } = await uploadToStorage("profile", file, uid!);
      const token = getAuthToken();
      await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ profilePhotoUrl: publicUrl, userId: uid }),
      });
      setPhotoUrl(publicUrl);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div
      className={`relative w-full aspect-video overflow-hidden rounded border border-zinc-800 bg-zinc-900 ${isAdmin ? "cursor-pointer hover:border-zinc-600 transition-colors" : ""
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
