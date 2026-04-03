"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/store";
import { getAuthToken } from "@/store/auth/slice";
import { useModal } from "@/components/common/useModal";

export default function OnboardingForm() {
  const { isAuthenticated, uid, username } = useAppSelector((s) => s.auth);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modal, renderModal] = useModal({ title: "Complete Your Profile" });

  const [form, setForm] = useState({
    displayName: "",
    tagline: "",
    aboutText: "",
    heroTitle: "",
    heroSubtitle: "",
  });

  useEffect(() => {
    if (!isAuthenticated || !uid) return;
    const token = getAuthToken();
    if (!token) return;

    fetch(`/api/users/${uid}`)
      .then((r) => r.json())
      .then((user) => {
        if (user && (!user.heroTitle && !user.aboutText)) {
          // Pre-fill with any existing data
          setForm((f) => ({
            ...f,
            displayName: user.displayName || "",
            tagline: user.tagline || "",
            heroTitle: user.heroTitle || "",
            heroSubtitle: user.heroSubtitle || "",
            aboutText: user.aboutText || "",
          }));
          setNeedsOnboarding(true);
          modal.open();
        }
      })
      .catch(() => {});
  }, [isAuthenticated, uid]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = getAuthToken();
      await fetch(`/api/users/${uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(form),
      });
      setNeedsOnboarding(false);
      modal.close();
    } finally {
      setSaving(false);
    }
  };

  if (!needsOnboarding) return null;

  const inputClass =
    "bg-transparent border border-zinc-800 rounded px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700 w-full";

  return renderModal(
    <div className="flex flex-col gap-4">
      <p className="text-zinc-400 text-xs font-mono">
        Welcome! Fill in your profile details to get started.
      </p>
      <input
        type="text"
        placeholder="Display Name *"
        value={form.displayName}
        onChange={(e) => setForm((f) => ({ ...f, displayName: e.target.value }))}
        className={inputClass}
      />
      <input
        type="text"
        placeholder="Tagline (e.g. Photographer & Videographer)"
        value={form.tagline}
        onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
        className={inputClass}
      />
      <input
        type="text"
        placeholder="Hero Title (shown on your home page)"
        value={form.heroTitle}
        onChange={(e) => setForm((f) => ({ ...f, heroTitle: e.target.value }))}
        className={inputClass}
      />
      <input
        type="text"
        placeholder="Hero Subtitle"
        value={form.heroSubtitle}
        onChange={(e) => setForm((f) => ({ ...f, heroSubtitle: e.target.value }))}
        className={inputClass}
      />
      <textarea
        placeholder="About text (separate paragraphs with blank lines)"
        value={form.aboutText}
        onChange={(e) => setForm((f) => ({ ...f, aboutText: e.target.value }))}
        rows={4}
        className={`${inputClass} resize-none`}
      />
    </div>,
    {
      size: "md",
      okButtonProps: {
        label: saving ? "Saving..." : "Save Profile",
        disabled: saving || !form.displayName,
        onClick: handleSave,
      },
    }
  );
}
