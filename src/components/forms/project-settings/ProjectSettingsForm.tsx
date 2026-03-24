"use client";

import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import BrandAvatar from "@/components/common/BrandAvatar";
import { Brand } from "@/store/content";
import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import { projectSettingsSchema, ProjectSettingsFormValues } from "./schema";

interface ExistingBrand extends Brand {
  projectSlug: string;
  projectName: string;
}

interface Props {
  slug: string;
  brands: Brand[];
  onChange: (brands: Brand[]) => void;
  onFileAdd: (blobUrl: string, file: File) => void;
  onFileRemove: (blobUrl: string) => void;
}

export default function ProjectSettingsForm({
  slug,
  brands,
  onChange,
  onFileAdd,
  onFileRemove,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [allBrands, setAllBrands] = useState<ExistingBrand[]>([]);
  const [loadingBrands, setLoadingBrands] = useState(false);

  useEffect(() => {
    setLoadingBrands(true);
    fetch(CONTENT_API_ROUTES.allBrands)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setAllBrands(data);
      })
      .finally(() => setLoadingBrands(false));
  }, []);

  // Deduplicate existing brands by name, exclude ones already added
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
    onFileAdd(blobUrl, file);
    setLogoPreview(blobUrl);
    e.target.value = "";
  };

  const onSubmit = (data: ProjectSettingsFormValues) => {
    const brand: Brand = {
      id: crypto.randomUUID(),
      name: data.name,
      logoUrl: logoPreview || "",
      socialUrl: data.socialUrl || undefined,
      review: data.review || undefined,
    };
    onChange([...brands, brand]);
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
    onChange([...brands, brand]);
  };

  const handleRemove = (id: string) => {
    const removed = brands.find((b) => b.id === id);
    if (removed?.logoUrl) onFileRemove(removed.logoUrl);
    onChange(brands.filter((b) => b.id !== id));
  };

  const inputClass =
    "bg-transparent border border-zinc-800 rounded px-3 py-2 text-white text-sm font-mono outline-none caret-white placeholder:text-zinc-700";

  return (
    <div className="flex flex-col gap-5">
      {brands.length > 0 && (
        <div className="flex flex-col gap-3">
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
            onSubmit={handleSubmit(onSubmit)}
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
    </div>
  );
}
