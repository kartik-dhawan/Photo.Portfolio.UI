"use client";

import { usePathname } from "next/navigation";
import { SOCIALS } from "@/lib/socials";

export default function SocialLinks() {
  const pathname = usePathname();

  if (pathname === "/about") return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 hidden md:flex flex-col gap-3 items-end">
      {SOCIALS.map((social) => (
        <a
          key={social.name}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          title={social.name}
          className="group flex items-center gap-2 text-zinc-600 hover:text-white transition-colors"
        >
          {social.followers && (
            <span className="text-[10px] font-mono tracking-wider opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200">
              {social.followers}
            </span>
          )}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d={social.icon} />
          </svg>
        </a>
      ))}
    </div>
  );
}
