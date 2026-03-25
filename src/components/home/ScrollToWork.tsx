"use client";

export default function ScrollToWork() {
  const handleClick = () => {
    document.getElementById("projects")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-3 mt-12 group cursor-pointer self-start" onClick={handleClick}>
      <button className="border border-zinc-600 group-hover:border-white rounded px-4 py-2 transition-colors cursor-pointer">
        <span className="text-zinc-300 text-xs md:text-sm font-mono uppercase tracking-widest group-hover:text-white transition-colors">
          View work
        </span>
      </button>
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-zinc-300 group-hover:text-white transition-colors animate-scroll-arrow"
      >
        <polyline points="7 13 12 18 17 13" />
        <polyline points="7 6 12 11 17 6" />
      </svg>
    </div>
  );
}
