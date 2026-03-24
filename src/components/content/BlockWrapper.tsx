"use client";

import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

export default function BlockWrapper({
  children,
  index,
  total,
  onMoveUp,
  onMoveDown,
  onDelete,
}: Props) {
  return (
    <div className="group/block relative border border-zinc-800/50 rounded-lg p-4">
      <div className="absolute -top-3 right-3 hidden group-hover/block:flex items-center gap-1 bg-black px-1">
        {index > 0 && (
          <button
            onClick={onMoveUp}
            className="text-zinc-600 hover:text-white text-xs cursor-pointer px-1"
            title="Move up"
          >
            &uarr;
          </button>
        )}
        {index < total - 1 && (
          <button
            onClick={onMoveDown}
            className="text-zinc-600 hover:text-white text-xs cursor-pointer px-1"
            title="Move down"
          >
            &darr;
          </button>
        )}
        <button
          onClick={onDelete}
          className="text-zinc-600 hover:text-red-400 text-xs cursor-pointer px-1"
          title="Delete block"
        >
          &times;
        </button>
      </div>
      {children}
    </div>
  );
}
