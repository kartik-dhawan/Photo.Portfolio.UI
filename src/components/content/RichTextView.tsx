import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function RichTextView({ markdown }: { markdown: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none font-[family-name:var(--font-geist-sans)]">
      <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
    </div>
  );
}
