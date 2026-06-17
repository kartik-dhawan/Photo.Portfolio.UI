import Image from "next/image";
import Link from "next/link";
import { ProjectCard } from "@/lib/content";
import GridRects from "@/components/home/GridRects";
import StickyHeader from "@/components/common/StickyHeader";
import ViewMoreSections from "@/components/content/ViewMoreSections";

interface OtherSection {
  name: string;
  href: string;
}

interface Props {
  sectionName: string;
  projects: ProjectCard[];
  otherSections?: OtherSection[];
}

function SectionCard({ project }: { project: ProjectCard }) {
  const dateBrand: string[] = [];
  if (project.filmedAt) {
    dateBrand.push(
      new Date(project.filmedAt + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    );
  }
  if (project.brandNames?.length) dateBrand.push(project.brandNames.join(", "));
  const dateBrandLine = dateBrand.join(" — ");
  const tagsLine = project.tags?.join(", ");

  return (
    <Link
      href={`/${project.slug}`}
      className="group block relative overflow-hidden rounded aspect-[4/3] bg-zinc-900"
    >
      {project.thumbnail ? (
        <Image
          src={project.thumbnail}
          alt={project.label}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          quality={75}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTgxODE4Ii8+PC9zdmc+"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-xs font-mono">
          No media
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
        <div className="p-4 flex flex-col gap-1 w-full">
          <p className="text-white text-sm md:text-base font-mono uppercase tracking-wider">
            {project.label}
          </p>
          {dateBrandLine && (
            <p className="text-zinc-400 text-[10px] md:text-xs font-mono truncate">
              {dateBrandLine}
            </p>
          )}
          {tagsLine && (
            <p className="text-zinc-500 text-[10px] font-mono truncate">
              {tagsLine}
            </p>
          )}
        </div>
      </div>
      <div className="absolute top-0 right-0 bottom-0 w-12 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      </div>
    </Link>
  );
}

export default function SectionPageView({ sectionName, projects, otherSections }: Props) {
  return (
    <div className="flex flex-col">
      <StickyHeader title={sectionName} />

      {/* Hero */}
      <div className="relative flex flex-col min-h-[35vh] md:min-h-[45vh] overflow-hidden px-6 md:px-8 pt-12 md:pt-20">
        <div className="absolute inset-0">
          <GridRects />
        </div>
        <div className="relative z-10 flex flex-col gap-3 justify-end h-full pb-6 md:pb-10">
          <Link
            href="/"
            className="self-start flex items-center gap-1 text-zinc-500 hover:text-zinc-300 text-[10px] font-mono uppercase tracking-wider transition-colors mb-1"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Home
          </Link>
          <h1 className="font-mono text-white text-2xl md:text-5xl xl:text-7xl uppercase tracking-wider leading-tight">
            {sectionName}
          </h1>
          <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
            {projects.length} {projects.length === 1 ? "project" : "projects"}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="px-6 md:px-8 pt-6 md:pt-12 pb-12">
        {projects.length === 0 ? (
          <p className="text-zinc-600 text-sm font-mono">No projects in this section yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project) => (
              <SectionCard key={project.slug} project={project} />
            ))}
          </div>
        )}
      </div>

      {otherSections && otherSections.length > 0 && (
        <div className="px-6 md:px-8">
          <ViewMoreSections sections={otherSections} title="View more sections" />
        </div>
      )}
    </div>
  );
}
