import { ContentBlock, Brand } from "@/store/content";
import MediaCaption from "./MediaCaption";

function extractPostId(url: string): string | null {
  const match = url.match(
    /instagram\.com\/(?:p|reel|reels)\/([A-Za-z0-9_-]+)/
  );
  return match?.[1] ?? null;
}

function getThumbnailUrl(postId: string): string {
  return `https://instagram.com/p/${postId}/media/?size=l`;
}

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
        const postId = extractPostId(item.url);
        if (!postId) return null;
        const brand = item.brandId
          ? brands?.find((b) => b.id === item.brandId)
          : undefined;
        return (
          <div key={i} className="flex flex-col gap-1">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative aspect-square w-full overflow-hidden rounded group"
            >
              <img
                src={getThumbnailUrl(postId)}
                alt={item.title ?? "Instagram post"}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="white"
                  className="opacity-0 group-hover:opacity-80 transition-opacity duration-300"
                >
                  <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10m0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6" />
                </svg>
              </div>
            </a>
            {(item.title || item.date || item.brandId) && (
              <MediaCaption item={item} brand={brand} />
            )}
          </div>
        );
      })}
    </div>
  );
}
