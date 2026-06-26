import { ContentBlock, Brand } from "@/store/content";
import MediaCaption from "./MediaCaption";

interface Props {
  block: ContentBlock;
  brands?: Brand[];
}

export default function InstagramBlockView({ block, brands }: Props) {
  const media = block.media ?? [];
  const layout = block.layout ?? "full";
  const colClass =
    layout === "third"
      ? "md:grid-cols-3"
      : layout === "half"
        ? "md:grid-cols-2"
        : "";

  return (
    <div className={`grid gap-4 grid-cols-1 ${colClass}`}>
      {media.map((item, i) => {
        if (!item.url) return null;
        const brand = item.brandId
          ? brands?.find((b) => b.id === item.brandId)
          : undefined;
        return (
          <a
            key={i}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 border border-zinc-800 rounded-lg px-4 py-3 hover:border-zinc-600 transition-colors group"
          >
            {item.thumbnailUrl ? (
              <img
                src={item.thumbnailUrl}
                alt=""
                className="w-10 h-10 rounded object-cover shrink-0"
              />
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                className="shrink-0"
              >
                <defs>
                  <linearGradient id={`ig-grad-${i}`} x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#feda75" />
                    <stop offset="25%" stopColor="#fa7e1e" />
                    <stop offset="50%" stopColor="#d62976" />
                    <stop offset="75%" stopColor="#962fbf" />
                    <stop offset="100%" stopColor="#4f5bd5" />
                  </linearGradient>
                </defs>
                <path
                  fill={`url(#ig-grad-${i})`}
                  d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6"
                />
              </svg>
            )}
            <div className="flex flex-col min-w-0">
              {item.title && (
                <span className="text-white text-sm font-mono truncate text-left">
                  {item.title}
                </span>
              )}
              {(item.date || item.brandId) && (
                <MediaCaption item={{ ...item, title: undefined }} brand={brand} className="text-left" />
              )}
              {!item.title && !item.date && !item.brandId && (
                <span className="text-zinc-500 text-xs font-mono">
                  View on Instagram
                </span>
              )}
            </div>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-700 group-hover:text-zinc-400 transition-colors ml-auto shrink-0"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
