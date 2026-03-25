"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function RouteLoaderIndicator() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const prevPath = useRef(pathname);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href === prevPath.current) return;
      setLoading(true);
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, []);

  useEffect(() => {
    prevPath.current = pathname;
    setLoading(false);
  }, [pathname]);

  if (!loading) return null;

  return (
    <div className="relative w-3 h-3 shrink-0">
      <div className="absolute inset-0 rounded-full border border-zinc-500 border-t-white animate-spin" />
    </div>
  );
}
