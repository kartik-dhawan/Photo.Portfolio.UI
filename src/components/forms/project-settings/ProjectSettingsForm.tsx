"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import BrandAvatar from "@/components/common/BrandAvatar";
import { Brand } from "@/store/content";
import { CONTENT_API_ROUTES, API_ROUTES } from "@/routeConfig/apiRoutes";
import { projectSettingsSchema, ProjectSettingsFormValues } from "./schema";

interface ExistingBrand extends Brand {
  projectSlug: string;
  projectName: string;
}

interface Props {
  slug: string;
  routeId: string;
  initialLabel: string;
  initialBrands: Brand[];
  onSaved: (brands: Brand[], label: string) => void;
  onStateChange?: (state: { hasChanges: boolean; saving: boolean; save: () => Promise<void> }) => void;
}

export default function ProjectSettingsForm({
  slug,
  routeId,
  initialLabel,
  initialBrands,
  onSaved,
  onStateChange,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [allBrands, setAllBrands] = useState<ExistingBrand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  const [label, setLabel] = useState(initialLabel);
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Track pending file uploads (blob URL -> File)
  const pendingFiles = useRef<Map<string, File>>(new Map());

  useEffect(() => {
    setLoadingBrands(true);
    fetch(CONTENT_API_ROUTES.allBrands)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllBrands(data);
      })
      .finally(() => setLoadingBrands(false));
  }, []);

  // Sync if parent data changes (e.g. after content save)
  useEffect(() => {
    setBrands(initialBrands);
  }, [initialBrands]);

  useEffect(() => {
    setLabel(initialLabel);
  }, [initialLabel]);

  const addedNames = new Set(brands.map((b) => b.name.toLowerCase()));
  const uniqueExisting = allBrands.reduce<ExistingBrand[]>((acc, b) => {
    const key = b.name.toLowerCase();
    if (!addedNames.has(key) && !acc.some((a) => a.name.toLowerCase() === key)) {
      acc.push(b);
    }
    return acc;
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProjectSettingsFormValues>({
    resolver: yupResolver(projectSettingsSchema),
    defaultValues: { name: "", socialUrl: "", review: "" },
  });

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    pendingFiles.current.set(blobUrl, file);
    setLogoPreview(blobUrl);
    e.target.value = "";
  };

  const onAddBrand = (data: ProjectSettingsFormValues) => {
    const brand: Brand = {
      id: crypto.randomUUID(),
      name: data.name,
      logoUrl: logoPreview || "",
      socialUrl: data.socialUrl || undefined,
      review: data.review || undefined,
    };
    setBrands((prev) => [...prev, brand]);
    reset();
    setLogoPreview("");
  };

  const handlePickExisting = (existing: ExistingBrand) => {
    const brand: Brand = {
      id: crypto.randomUUID(),
      name: existing.name,
      logoUrl: existing.logoUrl,
      socialUrl: existing.socialUrl,
      review: "",
    };
    setBrands((prev) => [...prev, brand]);
  };

  const handleRemove = (id: string) => {
    const removed = brands.find((b) => b.id === id);
    if (removed?.logoUrl && pendingFiles.current.has(removed.logoUrl)) {
      URL.revokeObjectURL(removed.logoUrl);
      pendingFiles.current.delete(removed.logoUrl);
    }
    setBrands((prev) => prev.filter((b) => b.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      // Upload any pending logo files
      const blobToRemote = new Map<string, string>();
      const uploads = Array.from(pendingFiles.current.entries()).map(
        async ([blobUrl, file]) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("slug", slug);
          const res = await fetch(CONTENT_API_ROUTES.upload, {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error("Failed to upload logo");
          const { url } = await res.json();
          blobToRemote.set(blobUrl, url);
          URL.revokeObjectURL(blobUrl);
        }
      );
      await Promise.all(uploads);
      pendingFiles.current.clear();

      // Replace blob URLs with remote URLs in brands
      const finalBrands = brands.map((brand) => ({
        ...brand,
        logoUrl: blobToRemote.get(brand.logoUrl) ?? brand.logoUrl,
      }));

      // Save brands and label in parallel
      const [brandsRes, labelRes] = await Promise.all([
        fetch(CONTENT_API_ROUTES.settings(slug), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ brands: finalBrands }),
        }),
        label !== initialLabel
          ? fetch(API_ROUTES.update(routeId), {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ label }),
            })
          : Promise.resolve({ ok: true }),
      ]);

      if (!brandsRes.ok) throw new Error("Failed to save brands");
      if (!labelRes.ok) throw new Error("Failed to update label");

      setBrands(finalBrands);
      onSaved(finalBrands, label);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    label !== initialLabel ||
    JSON.stringify(brands) !== JSON.stringify(initialBrands);

  const handleSaveRef = useRef(handleSave);
  handleSaveRef.current = handleSave;

  const stableSave = useCallback(() => handleSaveRef.current(), []);

  useEffect(() => {
    onStateChange?.({ hasChanges, saving, save: stableSave });
  }, [hasChanges, saving, onStateChange, stableSave]);

  const inputClass =
    "bg-transparent border border-zinc-800 rounded px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700";

  return (
    <fieldset disabled={saving} className="flex flex-col gap-5 disabled:opacity-50 disabled:pointer-events-none">
      {/* Route label */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
          Route Label
        </span>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={inputClass}
          placeholder="Route label"
        />
      </div>

      {/* Existing brands */}
      {brands.length > 0 && (
        <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Brands
          </span>
          {brands.map((brand) => (
            <div
              key={brand.id}
              className="flex items-center gap-3 border border-zinc-800 rounded px-3 py-2"
            >
              <BrandAvatar brand={brand} />
              <span className="text-white text-sm font-mono flex-1 truncate">
                {brand.name}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(brand.id)}
                className="text-zinc-600 hover:text-red-400 text-xs transition-colors cursor-pointer"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add brand */}
      <div className="flex flex-col gap-3 border-t border-zinc-800 pt-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-mono">
            Add Brand associations
          </span>
          <button
            type="button"
            onClick={() => setMode(mode === "new" ? "existing" : "new")}
            className="text-[10px] uppercase tracking-wider text-zinc-600 hover:text-zinc-300 font-mono transition-colors cursor-pointer"
          >
            {mode === "new" ? "Pick existing" : "Create new"}
          </button>
        </div>

        {mode === "existing" ? (
          <div className="flex flex-col gap-2">
            {loadingBrands && (
              <span className="text-zinc-600 text-xs font-mono">Loading...</span>
            )}
            {!loadingBrands && uniqueExisting.length === 0 && (
              <span className="text-zinc-700 text-xs font-mono">
                No other brands available
              </span>
            )}
            {uniqueExisting.map((brand) => (
              <button
                key={`${brand.id}-${brand.projectSlug}`}
                type="button"
                onClick={() => handlePickExisting(brand)}
                className="flex items-center gap-3 border border-zinc-800 rounded px-3 py-2 hover:border-zinc-600 transition-colors cursor-pointer text-left"
              >
                <BrandAvatar brand={brand} />
                <div className="flex flex-col flex-1 min-w-0">
                  <span className="text-white text-sm font-mono truncate">
                    {brand.name}
                  </span>
                  <span className="text-zinc-600 text-[10px] font-mono truncate">
                    from {brand.projectName}
                  </span>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <form
            onSubmit={handleSubmit(onAddBrand)}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-10 h-10 rounded-full border border-dashed border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:border-zinc-500 transition-colors"
              >
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-zinc-600 text-lg">+</span>
                )}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleLogoSelect}
                className="hidden"
              />
              <input
                {...register("name")}
                type="text"
                placeholder="Brand name"
                className={`${inputClass} flex-1`}
              />
            </div>
            {errors.name && (
              <span className="text-red-500 text-[10px]">
                {errors.name.message}
              </span>
            )}

            <input
              {...register("socialUrl")}
              type="url"
              placeholder="Social URL (optional)"
              className={inputClass}
            />
            {errors.socialUrl && (
              <span className="text-red-500 text-[10px]">
                {errors.socialUrl.message}
              </span>
            )}

            <textarea
              {...register("review")}
              placeholder="Review (optional)"
              rows={3}
              className={`${inputClass} resize-none`}
            />

            <button
              type="submit"
              className="text-[10px] uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 rounded px-3 py-1.5 transition-colors cursor-pointer self-start"
            >
              Add Brand
            </button>
          </form>
        )}
      </div>

      {/* Error */}
      {error && (
        <span className="text-red-500 text-[10px]">{error}</span>
      )}
    </fieldset>
  );
}
