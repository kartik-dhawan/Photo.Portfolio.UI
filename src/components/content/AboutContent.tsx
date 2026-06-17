import Link from 'next/link';
import BrandAvatar from '@/components/common/BrandAvatar';
import ProfilePhoto from '@/components/ProfilePhoto';
import StorageStats from '@/components/content/StorageStats';
import { Brand } from '@/store/content';
import { SocialLink } from '@/lib/socials';
import { BrandWithProject } from '@/lib/content';

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

interface Props {
  brands: BrandWithProject[];
  profilePhotoUrl: string;
  aboutText: string;
  socials: SocialLink[];
  userId: string;
}

export default function AboutContent({
  brands: rawBrands,
  profilePhotoUrl,
  aboutText,
  socials,
  userId,
}: Props) {
  const brands = groupBrandsByName(rawBrands);

  return (
    <div className="flex flex-col gap-12 w-full px-6 xl:px-24">
      <h1 className="text-white text-2xl font-mono uppercase tracking-wider">
        About
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mobile/tablet portrait: photo first, text second */}
        <div className="lg:hidden">
          <ProfilePhoto initialUrl={profilePhotoUrl} />
        </div>

        <div className="flex flex-col gap-6 font-[family-name:var(--font-geist-sans)]">
          {aboutText ? (
            aboutText.split("\n\n").map((paragraph, i) => (
              <p key={i} className={`text-sm leading-relaxed ${i === 0 ? "text-zinc-300" : "text-zinc-400"}`}>
                {paragraph}
              </p>
            ))
          ) : (
            <p className="text-zinc-500 text-sm">No bio yet.</p>
          )}
        </div>

        <div className="hidden lg:flex justify-end">
          <div className="w-2/3 xl:w-2/3 ml-auto">
            <ProfilePhoto initialUrl={profilePhotoUrl} />
          </div>
        </div>
      </div>

      {brands.length > 0 && (
        <div className="flex flex-col gap-6">
          <h2 className="text-zinc-400 text-xs font-mono uppercase tracking-wider text-center md:text-left">
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
                  <tr key={brand.id} className="border-b border-zinc-800/50">
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
                          <span
                            key={p.slug}
                            className="inline-flex items-center"
                          >
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
                    {brand.projects.length > 1 ? 'Projects: ' : 'Project: '}
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

      {/* Storage Stats */}
      <StorageStats userId={userId} />

      {/* Socials */}
      <div className="flex flex-col gap-6">
        <div className="border-t border-zinc-800" />
        <h2 className="text-zinc-400 text-xs font-mono uppercase tracking-wider text-center md:text-left">
          Connect
        </h2>
        <div className="flex flex-col gap-3">
          {socials.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 text-zinc-400 hover:text-white transition-colors group"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="shrink-0"
              >
                <path d={social.icon} />
              </svg>
              <span className="text-sm font-mono">
                {social.handle ?? social.name}
              </span>
              {social.followers && (
                <span className="text-zinc-600 text-xs font-mono">
                  {social.followers}
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function BrandInstagram({
  socialUrl,
  className = '',
}: {
  socialUrl?: string;
  className?: string;
}) {
  if (socialUrl && socialUrl.includes('instagram')) {
    const handle = socialUrl
      .replace(/https?:\/\/(www\.)?instagram\.com\//, '@')
      .replace(/\/$/, '');
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
