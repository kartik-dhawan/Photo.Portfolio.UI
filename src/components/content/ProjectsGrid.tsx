"use client";

import { useMemo } from "react";
import { useAppSelector } from "@/store";
import { ProjectCard as ProjectCardType } from "@/lib/content";
import ProjectCard from "./ProjectCard";

interface Props {
  projects: ProjectCardType[];
}

export default function ProjectsGrid({ projects }: Props) {
  const { items: navItems } = useAppSelector((s) => s.nav);

  const sorted = useMemo(() => {
    return [...projects]
      .filter((p) => {
        const nav = navItems.find((n) => n.route === `/${p.slug}`);
        return !nav?.hideFromHome;
      })
      .sort((a, b) => {
        const navA = navItems.find((n) => n.route === `/${a.slug}`);
        const navB = navItems.find((n) => n.route === `/${b.slug}`);
        const pinnedA = !!navA?.pinned;
        const pinnedB = !!navB?.pinned;
        if (pinnedA && !pinnedB) return -1;
        if (!pinnedA && pinnedB) return 1;
        return 0;
      });
  }, [projects, navItems]);

  if (sorted.length === 0) return null;

  return (
    <div className="px-3 md:px-6 xl:px-24 py-12">
      <h2 className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-8">
        Projects
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {sorted.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  );
}
