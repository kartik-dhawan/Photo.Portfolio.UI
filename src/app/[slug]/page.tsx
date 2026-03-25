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
