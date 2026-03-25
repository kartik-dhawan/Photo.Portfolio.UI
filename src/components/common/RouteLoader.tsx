"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteLoaderIndicator() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Wait a tick so preventDefault() from buttons has fired
      setTimeout(() => {
        if (e.defaultPrevented) return;
        const anchor = (e.target as HTMLElement).closest("a");
        if (!anchor) return;
        // Skip if click was on a button inside the anchor
        if ((e.target as HTMLElement).closest("button")) return;
        const href = anchor.getAttribute("href");
        if (!href || href.startsWith("http") || href.startsWith("#") || href === prevPath.current) return;
        setLoading(true);
        // Safety: clear after 3s if pathname never changes
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setLoading(false), 3000);
      }, 0);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  useEffect(() => {
    prevPath.current = pathname;
    setLoading(false);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="relative w-3 h-3 shrink-0">
      <div className="absolute inset-0 rounded-full border border-zinc-500 border-t-white animate-spin" />
    </div>
  );
}
