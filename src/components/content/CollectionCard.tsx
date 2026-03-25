import Image from "next/image";
import Link from "next/link";
import { CollectionItem } from "@/store/content/types";

// Deterministic ratio based on URL hash so each card always gets the same height
const RATIOS = [3 / 4, 4 / 5, 1, 5 / 4, 4 / 3];
function getStableRatio(url: string): number {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = url.charCodeAt(i) + ((hash << 5) - hash);
  }
  return RATIOS[Math.abs(hash) % RATIOS.length];
}

interface Props {
  item: CollectionItem;
}

export default function CollectionCard({ item }: Props) {
  const ratio = getStableRatio(item.url);

  return (
    <Link
      href={`/${item.projectSlug}`}
      className="block break-inside-avoid mb-4 group relative overflow-hidden rounded"
    >
      <div className="relative w-full bg-zinc-900" style={{ aspectRatio: `1 / ${ratio}` }}>
        <Image
          src={item.url}
          alt={item.title ?? ""}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
          quality={75}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTgxODE4Ii8+PC9zdmc+"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent md:from-transparent md:via-transparent md:bg-none md:group-hover:bg-black/40 transition-colors duration-300 flex items-end">
          <div className="p-3 md:translate-y-full md:group-hover:translate-y-0 transition-transform duration-300">
            {item.title && (
              <p className="text-white text-xs font-mono truncate">{item.title}</p>
            )}
            <p className="text-zinc-300 text-[10px] font-mono uppercase tracking-wider">
              {item.projectName}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
