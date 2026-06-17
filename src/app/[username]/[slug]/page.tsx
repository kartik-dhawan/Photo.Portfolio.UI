import { Metadata } from "next";
import { getUserByUsername } from "@/lib/users";
import { getNavItems } from "@/lib/navItems";
import { getPageContent, getProjectCardsForSection, getAllSections } from "@/lib/content";
import ViewMoreSections from "@/components/content/ViewMoreSections";
import { getSettings } from "@/lib/settings";
import PageContent from "@/components/content/PageContent";
import SectionPageView from "@/components/content/SectionPageView";

export const revalidate = 60;

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

async function resolveUser(username: string) {
  const user = await getUserByUsername(username);
  if (user) return user;
  return getUserByUsername(DEFAULT_USERNAME);
}

interface PageProps {
  params: Promise<{ username: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { username, slug } = await params;
  const user = await resolveUser(username);
  if (!user) return { title: slug };

  const [content, navItems, settings] = await Promise.all([
    getPageContent(user.uid, slug),
    getNavItems(user.uid),
    getSettings(user.uid),
  ]);

  const navItem = navItems.find((item) => item.route === `/${slug}`);
  const title = navItem?.label ?? slug;

  let ogImage: string | undefined;
  for (const block of content?.blocks ?? []) {
    if (block.type === "image") {
      const img = (block.media ?? []).find((m) => m.type === "image");
      if (img) { ogImage = img.url; break; }
    }
  }
  if (!ogImage && settings.profilePhotoUrl) {
    ogImage = settings.profilePhotoUrl;
  }

  let description = `${title} — Photography & videography by ${user.displayName}`;
  for (const block of content?.blocks ?? []) {
    if (block.type === "richtext" && block.markdown) {
      const text = block.markdown.replace(/[#*_\[\]()>`~-]/g, "").trim();
      if (text) {
        description = text.length > 160 ? text.slice(0, 157) + "..." : text;
        break;
      }
    }
  }

  const images = ogImage
    ? [{ url: ogImage, width: 1200, height: 630, alt: String(title) }]
    : undefined;

  return {
    title,
    description,
    openGraph: {
      title: `${title} — ${user.displayName}`,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — ${user.displayName}`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function SectionPage({ params }: PageProps) {
  const { username, slug } = await params;
  const user = await resolveUser(username);
  if (!user) return null;

  const [content, navItems, allSections] = await Promise.all([
    getPageContent(user.uid, slug),
    getNavItems(user.uid),
    getAllSections(user.uid),
  ]);

  const navItem = navItems.find((item) => item.route === `/${slug}`);

  // If the URL username matches the resolved user, we're in named-user mode (e.g. /kartik/slug).
  // Otherwise the "username" segment is actually a slug/section (clean-URL or custom-domain mode).
  // Use named-user prefix only when the URL username matches the resolved user
  const sectionBase = user.username === username ? `/${username}/sec` : "/sec";

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
  const sectionData = await getProjectCardsForSection(user.uid, slug);
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

  // No project and no section — render empty editable page
  return (
    <div className="h-full min-h-[80vh] py-12 px-2 md:px-8">
      <PageContent
        slug={slug}
        initialContent={null}
        initialLabel={slug}
        initialRouteId={""}
      />
    </div>
  );
}
