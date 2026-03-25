import { MetadataRoute } from "next";
import { getNavItems } from "@/lib/navItems";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://kartikdhawan.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const navItems = await getNavItems();

  const projectPages = navItems
    .filter((item) => !item.hidden)
    .map((item) => ({
      url: `${SITE_URL}${item.route}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...projectPages,
  ];
}
