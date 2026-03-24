"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CONTENT_API_ROUTES } from "@/routeConfig/apiRoutes";
import BrandAvatar from "@/components/common/BrandAvatar";
import Skeleton from "@/components/common/Skeleton";
import { Brand } from "@/store/content";

interface BrandWithProject extends Brand {
  projectSlug: string;
  projectName: string;
}

interface GroupedBrand extends Brand {
  projects: { slug: string; name: string }[];
}

function groupBrandsByName(brands: BrandWithProject[]): GroupedBrand[] {
  const map = new Map<string, GroupedBrand>();
  for (const b of brands) {
    const key = b.name.toLowerCase();
    if (map.has(key)) {
      const existing = map.get(key)!;
      if (!existing.projects.some((p) => p.slug === b.projectSlug)) {
        existing.projects.push({ slug: b.projectSlug, name: b.projectName });
      }
      if (!existing.review && b.review) existing.review = b.review;
      if (!existing.socialUrl && b.socialUrl) existing.socialUrl = b.socialUrl;
      if (!existing.logoUrl && b.logoUrl) existing.logoUrl = b.logoUrl;
    } else {
      map.set(key, {
        ...b,
        projects: [{ slug: b.projectSlug, name: b.projectName }],
      });
    }
  }
  return [...map.values()];
}

export default function AboutContent() {
  const [brands, setBrands] = useState<GroupedBrand[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(CONTENT_API_ROUTES.allBrands)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBrands(groupBrandsByName(data));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col gap-12 w-full px-6 xl:px-24">
      <div>
        <h1 className="text-white text-2xl font-mono uppercase tracking-wider">
          About
        </h1>
      </div>

      <div className="max-w-2xl flex flex-col gap-6 font-[family-name:var(--font-geist-sans)]">
        <p className="text-zinc-300 text-sm leading-relaxed">
          I&apos;m Kartik Dhawan — a photographer and videographer based in
          India. I specialize in portraits, brand storytelling, and cinematic
          video work. My approach is rooted in natural light, honest moments,
          and a minimal aesthetic.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Over the years, I&apos;ve had the opportunity to collaborate with
          incredible brands and individuals, capturing everything from intimate
          portraits to large-scale commercial projects. Every project is a new
          story, and I believe in letting the subject speak for itself.
        </p>
        <p className="text-zinc-400 text-sm leading-relaxed">
          When I&apos;m not behind the camera, you&apos;ll find me exploring
          new cities, curating playlists, or working on personal film projects.
          I&apos;m always open to new collaborations — feel free to reach out.
        </p>
      </div>

      {loading && (
        <div className="flex flex-col gap-6">
          <Skeleton className="h-3 w-40" />
          <div className="hidden md:flex flex-col gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-4 md:hidden">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
                <Skeleton className="h-2 w-32" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && brands.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-zinc-400 text-xs font-mono uppercase tracking-wider">
            Brands I&apos;ve Worked With
          </h2>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left font-mono text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="py-3 pr-4 text-[10px] uppercase tracking-wider text-zinc-600 font-normal" />
                  <th className="py-3 pr-4 text-[10px] uppercase tracking-wider text-zinc-600 font-normal">
                    Name
                  </th>
                  <th className="py-3 pr-4 text-[10px] uppercase tracking-wider text-zinc-600 font-normal">
                    Projects
                  </th>
                  <th className="py-3 pr-4 text-[10px] uppercase tracking-wider text-zinc-600 font-normal">
                    Review
                  </th>
                  <th className="py-3 text-[10px] uppercase tracking-wider text-zinc-600 font-normal">
                    Instagram
                  </th>
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr
                    key={brand.id}
                    className="border-b border-zinc-800/50"
                  >
                    <td className="py-3 pr-4">
                      <BrandAvatar brand={brand} />
                    </td>
                    <td className="py-3 pr-4">
                      {brand.socialUrl ? (
                        <a
                          href={brand.socialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-zinc-300 hover:text-white transition-colors underline underline-offset-2"
                        >
                          {brand.name}
                        </a>
                      ) : (
                        <span className="text-zinc-300">{brand.name}</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-x-2 gap-y-1">
                        {brand.projects.map((p, i) => (
                          <span key={p.slug} className="inline-flex items-center">
                            <Link
                              href={`/${p.slug}`}
                              className="text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
                            >
                              {p.name}
                            </Link>
                            {i < brand.projects.length - 1 && (
                              <span className="text-zinc-700 ml-2">,</span>
                            )}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-zinc-500 max-w-xs">
                      {brand.review ? (
                        <span className="line-clamp-2">{brand.review}</span>
                      ) : (
                        <span className="text-zinc-700">—</span>
                      )}
                    </td>
                    <td className="py-3">
                      <BrandInstagram socialUrl={brand.socialUrl} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-4 md:hidden">
            {brands.map((brand) => (
              <div
                key={brand.id}
                className="border border-zinc-800 rounded-lg p-4 flex flex-col gap-3"
              >
                <div className="flex items-center gap-3">
                  <BrandAvatar brand={brand} size="md" />
                  <div className="flex flex-col">
                    {brand.socialUrl ? (
                      <a
                        href={brand.socialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-200 text-sm font-mono hover:text-white transition-colors underline underline-offset-2"
                      >
                        {brand.name}
                      </a>
                    ) : (
                      <span className="text-zinc-200 text-sm font-mono">
                        {brand.name}
                      </span>
                    )}
                    <BrandInstagram
                      socialUrl={brand.socialUrl}
                      className="text-[10px]"
                    />
                  </div>
                </div>
                <div className="text-[10px] font-mono uppercase tracking-wider">
                  <span className="text-zinc-600">
                    {brand.projects.length > 1 ? "Projects: " : "Project: "}
                  </span>
                  {brand.projects.map((p, i) => (
                    <span key={p.slug}>
                      <Link
                        href={`/${p.slug}`}
                        className="text-zinc-400 hover:text-white transition-colors underline underline-offset-2"
                      >
                        {p.name}
                      </Link>
                      {i < brand.projects.length - 1 && (
                        <span className="text-zinc-700">, </span>
                      )}
                    </span>
                  ))}
                </div>
                {brand.review && (
                  <p className="text-zinc-500 text-xs font-mono line-clamp-3">
                    {brand.review}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BrandInstagram({
  socialUrl,
  className = "",
}: {
  socialUrl?: string;
  className?: string;
}) {
  if (socialUrl && socialUrl.includes("instagram")) {
    const handle = socialUrl
      .replace(/https?:\/\/(www\.)?instagram\.com\//, "@")
      .replace(/\/$/, "");
    return (
      <a
        href={socialUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-zinc-400 hover:text-white transition-colors underline underline-offset-2 font-mono ${className}`}
      >
        {handle}
      </a>
    );
  }
  return <span className={`text-zinc-700 font-mono ${className}`}>N/A</span>;
}
