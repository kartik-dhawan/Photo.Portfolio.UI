import { Metadata } from "next";
import { getUserByUsername } from "@/lib/users";
import { getNavItems } from "@/lib/navItems";
import { getPageContent } from "@/lib/content";
import { getSettings } from "@/lib/settings";
import PageContent from "@/components/content/PageContent";

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

  const [content, navItems] = await Promise.all([
    getPageContent(user.uid, slug),
    getNavItems(user.uid),
  ]);

  const navItem = navItems.find((item) => item.route === `/${slug}`);

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
