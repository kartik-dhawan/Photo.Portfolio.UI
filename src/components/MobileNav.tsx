"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 py-4 bg-black/90 backdrop-blur-sm border-b border-zinc-900">
        <span className="font-mono text-xs uppercase tracking-wider text-white font-bold">
          Kartik
        </span>
        <button
          onClick={() => setOpen(!open)}
          className="flex flex-col gap-[5px] w-6 cursor-pointer"
          aria-label="Toggle menu"
        >
          <span
            className={`block h-[1.5px] bg-white transition-transform duration-300 ${
              open ? "rotate-45 translate-y-[6.5px]" : ""
            }`}
          />
          <span
            className={`block h-[1.5px] bg-white transition-opacity duration-300 ${
              open ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-[1.5px] bg-white transition-transform duration-300 ${
              open ? "-rotate-45 -translate-y-[6.5px]" : ""
            }`}
          />
        </button>
      </header>

      <div
        className={`md:hidden fixed inset-0 z-40 bg-black pt-16 px-6 py-8 overflow-y-auto transition-opacity duration-200 ${
          open ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <Sidebar onNavigate={() => setOpen(false)} />
      </div>
    </>
  );
}
