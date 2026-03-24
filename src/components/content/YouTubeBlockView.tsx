import { ContentBlock, Brand } from "@/store/content";
import MediaCaption from "./MediaCaption";

function extractVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] ?? null;
}

interface Props {
  block: ContentBlock;
  brands?: Brand[];
}

export default function YouTubeBlockView({ block, brands }: Props) {
  const media = block.media ?? [];
  const isHalf = block.layout === "half";

  return (
    <div
      className={`grid gap-4 grid-cols-1 ${isHalf ? "md:grid-cols-2" : ""}`}
    >
      {media.map((item, i) => {
        const videoId = extractVideoId(item.url);
        if (!videoId) return null;
        const brand = item.brandId
          ? brands?.find((b) => b.id === item.brandId)
          : undefined;
        return (
          <div key={i} className="flex flex-col gap-1">
            <div className="aspect-video w-full">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full rounded"
              />
            </div>
            {(item.title || item.date || item.brandId) && (
              <MediaCaption item={item} brand={brand} />
            )}
          </div>
        );
      })}
      {isHalf && media.length === 1 && (
        <div className="hidden md:block aspect-video" />
      )}
    </div>
  );
}
