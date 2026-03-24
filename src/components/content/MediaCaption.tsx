import { MediaItem, Brand } from "@/store/content";
import { formatDuration } from "@/components/forms/media-meta/schema";

interface Props {
  item: MediaItem;
  brand?: Brand;
}

export default function MediaCaption({ item, brand }: Props) {
  const titleText = item.title ?? "";

  const titleEl = item.link ? (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="text-zinc-400 hover:text-white text-xs font-mono transition-colors underline underline-offset-2"
    >
      {titleText}
    </a>
  ) : (
    <span className="text-zinc-400 text-xs font-mono">{titleText}</span>
  );

  const dateParts: string[] = [];
  if (item.date) dateParts.push(item.date);
  if (item.type === "video" && item.duration) {
    dateParts.push(formatDuration(item.duration));
  }
  const dateText = dateParts.join(" - ");

  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2">
        {titleText && titleEl}
        {titleText && brand && (
          <span className="text-zinc-700 text-xs font-mono">-</span>
        )}
        {brand && (
          <span className="text-zinc-500 text-xs font-mono">
            {brand.name}
          </span>
        )}
      </div>
      {dateText && (
        <p className="text-zinc-600 text-[10px] font-mono">{dateText}</p>
      )}
    </div>
  );
}
