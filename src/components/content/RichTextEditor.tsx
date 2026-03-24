"use client";

import { useState } from "react";
import { ContentBlock } from "@/store/content";
import RichTextView from "./RichTextView";

interface Props {
  block: ContentBlock;
  onChange: (data: Partial<ContentBlock>) => void;
}

export default function RichTextEditor({ block, onChange }: Props) {
  const [preview, setPreview] = useState(false);
  const markdown = block.markdown ?? "";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <button
          onClick={() => setPreview(false)}
          className={`text-[10px] uppercase tracking-wider cursor-pointer ${
            !preview ? "text-white" : "text-zinc-600 hover:text-zinc-400"
          } transition-colors`}
        >
          Write
        </button>
        <button
          onClick={() => setPreview(true)}
          className={`text-[10px] uppercase tracking-wider cursor-pointer ${
            preview ? "text-white" : "text-zinc-600 hover:text-zinc-400"
          } transition-colors`}
        >
          Preview
        </button>
      </div>
      {preview ? (
        <div className="min-h-[120px] border border-zinc-800 rounded p-3">
          <RichTextView markdown={markdown} />
        </div>
      ) : (
        <textarea
          value={markdown}
          onChange={(e) => onChange({ markdown: e.target.value })}
          placeholder="Write markdown..."
          className="w-full min-h-[120px] bg-zinc-900 border border-zinc-800 rounded p-3 text-white text-sm font-mono outline-none resize-y placeholder:text-zinc-700 caret-white"
        />
      )}
    </div>
  );
}
