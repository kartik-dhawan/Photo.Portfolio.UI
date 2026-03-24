import { ContentBlock, Brand } from "@/store/content";
import ImageBlockView from "./ImageBlockView";
import RichTextView from "./RichTextView";
import YouTubeBlockView from "./YouTubeBlockView";

interface Props {
  block: ContentBlock;
  brands?: Brand[];
}

export default function BlockRenderer({ block, brands }: Props) {
  switch (block.type) {
    case "image":
      return <ImageBlockView block={block} brands={brands} />;
    case "richtext":
      return <RichTextView markdown={block.markdown ?? ""} />;
    case "youtube":
      return <YouTubeBlockView block={block} brands={brands} />;
    case "spacer":
      return <div style={{ height: 32 }} />;
    default:
      return null;
  }
}
