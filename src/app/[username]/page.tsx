import { getUserByUsername } from "@/lib/users";
import { getAllMedia, getProjectCards, getPageContent, getProjectCardsForSection, getAllSections, getAllBrands } from "@/lib/content";
import ViewMoreSections from "@/components/content/ViewMoreSections";
import { getNavItems } from "@/lib/navItems";
import SectionPageView from "@/components/content/SectionPageView";
import FloatingPaths from "@/components/home/FloatingPaths";
import ScrollToWork from "@/components/home/ScrollToWork";
import StickyHeader from "@/components/common/StickyHeader";
import ProjectsGrid from "@/components/content/ProjectsGrid";
import CollectionsGrid from "@/components/content/CollectionsGrid";
import PageContent from "@/components/content/PageContent";
import AdminRedirect from "@/components/AdminRedirect";
import BrandsStrip from "@/components/home/BrandsStrip";

function isQuotaError(error: unknown): boolean {
  if (error instanceof Error) {
    return error.message.includes('Quota exceeded') || error.message.includes('RESOURCE_EXHAUSTED');
  }
  return (error as { code?: number })?.code === 8;
}

function ServiceUnavailable({ quota = false }: { quota?: boolean }) {
  if (quota) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <p className="text-zinc-400 text-sm font-mono uppercase tracking-widest">Maintenance block</p>
        <p className="text-zinc-600 text-xs font-mono text-center max-w-xs">
          Firebase read quota exceeded. Service will resume after 12:30 PM.
        </p>
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-zinc-600 text-sm font-mono">Service unavailable temporarily, please check after a while.</p>
    </div>
  );
}

export const revalidate = 3600;

const PAGE_SIZE = 20;
const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

interface PageProps {
  params: Promise<{ username: string }>;
}

export default async function UserHomePage({ params }: PageProps) {
  const { username } = await params;

  let user;
  try {
    user = await getUserByUsername(username);
  } catch (e) {
    return <ServiceUnavailable quota={isQuotaError(e)} />;
  }

  if (user) {
    // Real username — render their home page
    let items: Awaited<ReturnType<typeof getAllMedia>>['items'] = [];
    let total = 0;
    let projects: Awaited<ReturnType<typeof getProjectCards>> = [];
    let allBrands: Awaited<ReturnType<typeof getAllBrands>> = [];
    try {
      ([{ items, total }, projects, allBrands] = await Promise.all([
        getAllMedia(user.uid, 1, PAGE_SIZE),
        getProjectCards(user.uid),
        getAllBrands(user.uid),
      ]));
    } catch {
      return <ServiceUnavailable />;
    }
    // Deduplicate by name, keep only brands with a logo
    const seen = new Set<string>();
    const brands = allBrands
      .filter((b) => {
        if (!b.logoUrl?.startsWith("http")) return false;
        const key = b.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((b) => ({ name: b.name, logoUrl: b.logoUrl, socialUrl: b.socialUrl }));

    const heroTitle = user.heroTitle || "Portfolio";
    const heroSubtitle = user.heroSubtitle || "";

    return (
      <div className="flex flex-col">
        <AdminRedirect />
        <StickyHeader title={heroTitle} />
        <div className="relative flex flex-col min-h-[55vh] md:min-h-[80vh] overflow-hidden px-6 md:px-8 pt-10 md:pt-20">
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
            <BrandsStrip brands={brands} />
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
              userId={user.uid}
            />
          </div>
        )}
      </div>
    );
  }

  // Not a real username — treat as a slug for the default user
  // e.g. /portraits → render default user's "portraits" project page
  let defaultUser;
  try {
    defaultUser = await getUserByUsername(DEFAULT_USERNAME);
  } catch (e) {
    return <ServiceUnavailable quota={isQuotaError(e)} />;
  }
  if (!defaultUser) return null;

  const slug = username;
  let content, navItems, allSections;
  try {
    ([content, navItems, allSections] = await Promise.all([
      getPageContent(defaultUser.uid, slug),
      getNavItems(defaultUser.uid),
      getAllSections(defaultUser.uid),
    ]));
  } catch (e) {
    return <ServiceUnavailable quota={isQuotaError(e)} />;
  }

  const navItem = navItems.find((item) => item.route === `/${slug}`);
  // "username" is actually a slug here (not a real username), so always use clean section URLs
  const sectionBase = "/sec";

  // Known project → render it
  if (navItem || content) {
    const currentSectionSlug = navItem?.sectionName
      ? (await import("@/lib/section-name")).sectionSlug(navItem.sectionName)
      : null;
    const otherSections = allSections
      .filter((s) => s.slug !== currentSectionSlug)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((s) => ({ name: s.name, href: `${sectionBase}/${s.slug}` }));
    return (
      <div className="flex flex-col">
        <div className="h-full min-h-[80vh] py-12 px-2 md:px-8">
          <PageContent
            slug={slug}
            initialContent={content}
            initialLabel={navItem?.label ?? slug}
            initialRouteId={navItem?.id ?? ""}
          />
        </div>
        <ViewMoreSections sections={otherSections} />
      </div>
    );
  }

  // Check if slug matches a section name
  let sectionData;
  try {
    sectionData = await getProjectCardsForSection(defaultUser.uid, slug);
  } catch (e) {
    return <ServiceUnavailable quota={isQuotaError(e)} />;
  }
  if (sectionData) {
    const otherSections = allSections
      .filter((s) => s.slug !== slug)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
      .map((s) => ({ name: s.name, href: `${sectionBase}/${s.slug}` }));
    return (
      <SectionPageView
        sectionName={sectionData.sectionName}
        projects={sectionData.projects}
        otherSections={otherSections}
      />
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <p className="text-zinc-600 text-sm font-mono">Page not found</p>
    </div>
  );
}
