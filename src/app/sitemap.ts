import { MetadataRoute } from 'next';
import { getNavItems } from '@/lib/navItems';
import { getAllUsers } from '@/lib/users';

export const dynamic = 'force-dynamic';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kartikdhawan.in';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const allPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];

  let users;
  try {
    users = await getAllUsers();
  } catch {
    return allPages;
  }

  for (const user of users) {
    let navItems = [];
    try {
      navItems = await getNavItems(user.uid);
    } catch {
      // skip nav items for this user if unavailable
    }
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
