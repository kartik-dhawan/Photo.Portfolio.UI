import { MetadataRoute } from 'next';
import { getNavItems } from '@/lib/navItems';
import { getAllUsers } from '@/lib/users';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kartikdhawan.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const users = await getAllUsers();
  const allPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  for (const user of users) {
    const navItems = await getNavItems(user.uid);
    allPages.push({
      url: `${SITE_URL}/${user.username}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    });
    allPages.push({
      url: `${SITE_URL}/${user.username}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    });
    for (const item of navItems.filter((i) => !i.hidden)) {
      allPages.push({
        url: `${SITE_URL}/${user.username}${item.route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      });
    }
  }

  return allPages;
}
