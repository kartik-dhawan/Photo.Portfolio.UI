import Link from "next/link";

interface Section {
  name: string;
  href: string;
}

interface Props {
  sections: Section[];
  title?: string;
}

export default function ViewMoreSections({ sections, title = "View more projects" }: Props) {
  if (sections.length === 0) return null;

  return (
    <div className="mx-4 md:mx-0 px-2 md:px-8 pb-16 border-t border-zinc-800 pt-10 mt-4">
      <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest mb-4">
        {title}
      </p>
      <div className="grid grid-cols-2 gap-3">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group flex items-center justify-between border border-zinc-800 hover:border-zinc-500 rounded px-4 py-3 md:px-5 md:py-4 transition-colors"
          >
            <span className="font-mono uppercase tracking-wider text-sm text-zinc-400 group-hover:text-white transition-colors">
              {s.name}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        ))}
      </div>
    </div>
  );
}
