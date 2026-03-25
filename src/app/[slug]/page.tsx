import { Metadata } from "next";
import { getNavItems } from "@/lib/navItems";
import { getPageContent } from "@/lib/content";
import { PageContent as PageContentType } from "@/store/content/types";
import PageContent from "@/components/content/PageContent";

export const revalidate = 60;

export async function generateStaticParams() {
  const navItems = await getNavItems();
  return navItems.map((item) => ({
    slug: item.route.replace(/^\//, ""),
  }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const [content, navItems] = await Promise.all([
    getPageContent(slug),
    getNavItems(),
  ]);

  const navItem = navItems.find((item) => item.route === `/${slug}`);
  const title = navItem?.label ?? slug;

  // First image from content blocks
  let ogImage: string | undefined;
  for (const block of content?.blocks ?? []) {
    if (block.type === "image") {
      const img = (block.media ?? []).find((m) => m.type === "image");
      if (img) { ogImage = img.url; break; }
    }
  }

  // First text block as description
  let description = `${title} — Photography & videography by Kartik Dhawan`;
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
      title: `${title} — Kartik Dhawan`,
      description,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Kartik Dhawan`,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function SectionPage({ params }: PageProps) {
  const { slug } = await params;
  const [content, navItems] = await Promise.all([
    getPageContent(slug),
    getNavItems(),
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
