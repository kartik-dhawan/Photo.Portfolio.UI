import { getAllMedia, getProjectCards } from '@/lib/content';
import FloatingPaths from '@/components/home/FloatingPaths';
import ProjectsGrid from '@/components/content/ProjectsGrid';
import CollectionsGrid from '@/components/content/CollectionsGrid';

export const revalidate = 60;

const PAGE_SIZE = 20;

export default async function Home() {
  const [{ items, total }, projects] = await Promise.all([
    getAllMedia(1, PAGE_SIZE),
    getProjectCards(),
  ]);

  return (
    <div className="flex flex-col">
      <div className="relative flex flex-col min-h-[80vh] overflow-hidden px-6 md:px-8 pt-12 md:pt-20">
        <div className="absolute inset-0">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <div className="relative z-10 flex flex-col gap-4">
          <h1 className="font-mono text-white text-3xl md:text-5xl xl:text-7xl uppercase tracking-wider leading-tight">
            Making intentions
            <br />
            meet cinema
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm font-mono uppercase tracking-widest">
            Video/photographer for the fearless, the open minded &amp; the
            adventurous
          </p>
        </div>
      </div>

      <ProjectsGrid projects={projects} />

      {items.length > 0 && (
        <div className="px-3 md:px-6 xl:px-24 py-12">
          <h2 className="text-zinc-400 text-xs font-mono uppercase tracking-wider mb-8">
            All Work
          </h2>
          <CollectionsGrid
            initialItems={items}
            total={total}
            pageSize={PAGE_SIZE}
          />
        </div>
      )}
    </div>
  );
}
