import { getUserByUsername } from "@/lib/users";
import { getAllMedia, getProjectCards, getPageContent } from "@/lib/content";
import { getNavItems } from "@/lib/navItems";
import FloatingPaths from "@/components/home/FloatingPaths";
import ScrollToWork from "@/components/home/ScrollToWork";
import StickyHeader from "@/components/common/StickyHeader";
import ProjectsGrid from "@/components/content/ProjectsGrid";
import CollectionsGrid from "@/components/content/CollectionsGrid";
import PageContent from "@/components/content/PageContent";

export const revalidate = 60;

const PAGE_SIZE = 20;
const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserHomePage({ params }: PageProps) {
  const { username } = await params;
  const user = await getUserByUsername(username);

  if (user) {
    // Real username — render their home page
    const [{ items, total }, projects] = await Promise.all([
      getAllMedia(user.uid, 1, PAGE_SIZE),
      getProjectCards(user.uid),
    ]);

    const heroTitle = user.heroTitle || "Portfolio";
    const heroSubtitle = user.heroSubtitle || "";

    return (
      <div className="flex flex-col">
        <StickyHeader title={heroTitle} />
        <div className="relative flex flex-col min-h-[80vh] overflow-hidden px-6 md:px-8 pt-12 md:pt-20">
          <div className="absolute inset-0">
            <FloatingPaths position={1} />
            <FloatingPaths position={-1} />
          </div>
          <div className="relative z-10 flex flex-col gap-4">
            <h1 className="font-mono text-white text-3xl md:text-5xl xl:text-7xl uppercase tracking-wider leading-tight">
              {heroTitle}
            </h1>
            {heroSubtitle && (
              <p className="text-zinc-500 text-xs md:text-sm font-mono uppercase tracking-widest">
                {heroSubtitle}
              </p>
            )}
            <ScrollToWork />
          </div>
        </div>

        <ProjectsGrid projects={projects} />

        {items.length > 0 && (
          <div data-section="All Work" className="px-3 md:px-6 xl:px-24 py-12">
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

  // Not a real username — treat as a slug for the default user
  // e.g. /portraits → render default user's "portraits" project page
  const defaultUser = await getUserByUsername(DEFAULT_USERNAME);
  if (!defaultUser) return null;

  const slug = username;
  const [content, navItems] = await Promise.all([
    getPageContent(defaultUser.uid, slug),
    getNavItems(defaultUser.uid),
  ]);

  const navItem = navItems.find((item) => item.route === `/${slug}`);
  if (!navItem && !content) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <p className="text-zinc-600 text-sm font-mono">Page not found</p>
      </div>
    );
  }

  return (
    <div className="h-full min-h-[80vh] py-12 px-2 md:px-8">
      <PageContent
        slug={slug}
        initialContent={content}
        initialLabel={navItem?.label ?? slug}
        initialRouteId={navItem?.id ?? ""}
      />
    </div>
  );
}
