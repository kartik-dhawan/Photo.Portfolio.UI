"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function GridRects() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  // Concentric rectangles filling the viewBox from outside in
  const rects = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: i * 14,
    y: i * 8,
    width: 696 - i * 28,
    height: 316 - i * 16,
    strokeWidth: 0.3 + i * 0.025,
    opacity: 0.04 + i * 0.012,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg className="w-full h-full text-white" viewBox="0 0 696 316" fill="none">
        <title>Background Pattern</title>
        {rects.map((r) => (
          <motion.rect
            key={r.id}
            x={r.x}
            y={r.y}
            width={r.width}
            height={r.height}
            stroke="currentColor"
            strokeWidth={r.strokeWidth}
            strokeOpacity={r.opacity}
            fill="none"
            initial={{ pathLength: 0.2, opacity: 0.3 }}
            animate={{
              pathLength: 1,
              opacity: [0.15, r.opacity * 6, 0.15],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 18 + (r.id % 8) * 2,
              repeat: Infinity,
              ease: "linear",
              delay: r.id * 0.35,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
