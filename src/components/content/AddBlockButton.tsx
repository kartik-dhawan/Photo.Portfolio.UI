"use client";

import { useRef, useState, useEffect } from "react";
import { BlockType } from "@/store/content";

interface Props {
  onAdd: (type: BlockType) => void;
}

export default function AddBlockButton({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setDropUp(spaceBelow < 200);
  }, [open]);

  const handleSelect = (type: BlockType) => {
    onAdd(type);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={btnRef}
        onClick={() => setOpen(!open)}
        className="text-xs text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
      >
        + Add Block
      </button>
      {open && (
        <div
          className={`absolute left-0 bg-zinc-900 border border-zinc-800 rounded overflow-hidden z-10 ${
            dropUp ? "bottom-full mb-1" : "top-full mt-1"
          }`}
        >
          <button
            onClick={() => handleSelect("image")}
            className="block w-full text-left px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Image / Video
          </button>
          <button
            onClick={() => handleSelect("richtext")}
            className="block w-full text-left px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Rich Text
          </button>
          <button
            onClick={() => handleSelect("youtube")}
            className="block w-full text-left px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            YouTube Embed
          </button>
          <button
            onClick={() => handleSelect("spacer")}
            className="block w-full text-left px-4 py-2 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Spacer
          </button>
        </div>
      )}
    </div>
  );
}
