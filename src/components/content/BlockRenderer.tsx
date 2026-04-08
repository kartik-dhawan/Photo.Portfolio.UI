import { ContentBlock, BlockType, Brand, SectionNames } from "@/store/content";
import ImageBlockView from "./ImageBlockView";
import RichTextView from "./RichTextView";
import YouTubeBlockView from "./YouTubeBlockView";
import InstagramBlockView from "./InstagramBlockView";

interface Props {
  block: ContentBlock;
  brands?: Brand[];
  prevBlockType?: BlockType;
  sectionNames?: SectionNames;
}

export default function BlockRenderer({ block, brands, prevBlockType, sectionNames }: Props) {
  const showTitle = prevBlockType !== block.type;

  switch (block.type) {
    case "image":
      return <ImageBlockView block={block} brands={brands} />;
    case "richtext":
      return <RichTextView markdown={block.markdown ?? ""} />;
    case "youtube":
      return (
        <div className="flex flex-col gap-3">
          {showTitle && (
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
              {sectionNames?.youtube || "YouTube References"}
            </span>
          )}
          <YouTubeBlockView block={block} brands={brands} />
        </div>
      );
    case "instagram":
      return (
        <div className="flex flex-col gap-3">
          {showTitle && (
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-mono">
              {sectionNames?.instagram || "Instagram References"}
            </span>
          )}
          <InstagramBlockView block={block} brands={brands} />
        </div>
      );
    case "spacer":
      return <div style={{ height: 32 }} />;
    default:
      return null;
  }
}
