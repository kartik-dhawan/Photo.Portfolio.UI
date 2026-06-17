"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function GridRects() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  // Concentric rectangles filling the viewBox from outside in
  const rects = Array.from({ length: 48 }, (_, i) => ({
    id: i,
    x: i * 7,
    y: i * 4,
    width: 696 - i * 14,
    height: 316 - i * 8,
    strokeWidth: 0.5 + i * 0.02,
    opacity: 0.12 + i * 0.01,
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
            initial={{ pathLength: 0.2, opacity: 0.4 }}
            animate={{
              pathLength: 1,
              opacity: [r.opacity, r.opacity * 4, r.opacity],
              pathOffset: [0, 1, 0],
            }}
            transition={{
              duration: 14 + (r.id % 8) * 1.5,
              repeat: Infinity,
              ease: "linear",
              delay: r.id * 0.18,
            }}
          />
        ))}
      </svg>
    </div>
  );
}
