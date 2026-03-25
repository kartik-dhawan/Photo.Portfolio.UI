import { MediaItem, Brand } from "@/store/content";
import { formatDuration } from "@/components/forms/media-meta/schema";

interface Props {
  item: MediaItem;
  brand?: Brand;
}

export default function MediaCaption({ item, brand }: Props) {
  const parts: string[] = [];
  if (item.title) parts.push(item.title);
  if (brand) parts.push(brand.name);
  if (item.date) parts.push(item.date);
  if (item.type === "video" && item.duration)
    parts.push(formatDuration(item.duration));

  if (parts.length === 0) return null;

  const caption = parts.join(" — ");

  return (
    <p className="text-zinc-400 text-xs font-mono text-center break-words">
      {item.link ? (
        <a
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white transition-colors underline underline-offset-2"
        >
          {caption}
        </a>
      ) : (
        caption
      )}
    </p>
  );
}
