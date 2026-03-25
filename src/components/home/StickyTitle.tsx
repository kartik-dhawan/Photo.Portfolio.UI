"use client";

import { useEffect, useState } from "react";

export default function StickyTitle() {
  const [visible, setVisible] = useState(false);
  const [sectionName, setSectionName] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.6);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the last section that's intersecting (topmost visible)
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setSectionName(entry.target.getAttribute("data-section") ?? "");
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    const observe = () => {
      document.querySelectorAll("[data-section]").forEach((el) => observer.observe(el));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    observe();
    // Re-observe when DOM changes (e.g. infinite scroll adds content)
    const mutationObserver = new MutationObserver(observe);
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);

  return (
    <div
      className={`fixed top-14 md:top-0 left-0 md:left-64 right-0 z-30 flex flex-col items-center py-2 md:py-3 bg-black/80 backdrop-blur-sm border-b border-zinc-900 transition-all duration-300 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 -translate-y-full pointer-events-none"
      }`}
    >
      <p className="text-white text-xs font-mono uppercase tracking-widest">
        Making intentions meet cinema
      </p>
      {sectionName && (
        <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-wider mt-1">
          {sectionName}
        </p>
      )}
    </div>
  );
}
