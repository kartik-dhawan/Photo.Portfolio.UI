import { getAdminDb } from "@/firebase/admin";
import { Brand, ContentBlock, PageContent, CollectionItem, CollectionsResponse } from "@/store/content/types";

const COLLECTION = "portfolio_content";

export async function getPageContent(
  slug: string
): Promise<PageContent | null> {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(slug).get();
  if (!doc.exists) return null;
  return { slug, ...doc.data() } as PageContent;
}

export async function savePageContent(
  slug: string,
  blocks: ContentBlock[],
  brands?: Brand[]
): Promise<void> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const ref = db.collection(COLLECTION).doc(slug);
  const existing = await ref.get();

  if (existing.exists) {
    await ref.update({
      blocks,
      brands: brands ?? [],
      updatedAt: now,
    });
  } else {
    await ref.set({
      slug,
      blocks,
      brands: brands ?? [],
      tags: [],
      filmedAt: "",
      updatedAt: now,
      createdAt: now,
    });
  }
}

export async function updatePageSettings(
  slug: string,
  settings: { brands: Brand[]; tags: string[]; filmedAt: string }
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(slug);
  const existing = await ref.get();
  if (existing.exists) {
    await ref.update({ brands: settings.brands, tags: settings.tags, filmedAt: settings.filmedAt });
  } else {
    await ref.set({
      slug,
      blocks: [],
      brands: settings.brands,
      tags: settings.tags,
      filmedAt: settings.filmedAt,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }
}

export interface BrandWithProject extends Brand {
  projectSlug: string;
  projectName: string;
}

export async function getAllBrands(): Promise<BrandWithProject[]> {
  const db = getAdminDb();
  const [contentSnapshot, routesSnapshot] = await Promise.all([
    db.collection(COLLECTION).get(),
    db.collection("portfolio_routes").get(),
  ]);

  const routeMap = new Map<string, { label: string; hidden: boolean }>();
  for (const doc of routesSnapshot.docs) {
    const data = doc.data();
    const slug = (data.route as string)?.replace(/^\//, "");
    if (slug) routeMap.set(slug, { label: data.label as string, hidden: !!data.hidden });
  }

  const brands: BrandWithProject[] = [];

  for (const doc of contentSnapshot.docs) {
    const data = doc.data();
    const slug = doc.id;
    const brandsList = data.brands as Brand[] | undefined;
    if (!brandsList?.length) continue;
    const route = routeMap.get(slug);
    if (route?.hidden) continue;
    const projectName = route?.label ?? slug;
    for (const brand of brandsList) {
      brands.push({
        ...brand,
        projectSlug: slug,
        projectName,
      });
    }
  }

  return brands;
}

export interface ProjectCard {
  slug: string;
  label: string;
  thumbnail?: string;
  tags?: string[];
  filmedAt?: string;
  brandNames?: string[];
  pinned?: boolean;
}

export async function getProjectCards(): Promise<ProjectCard[]> {
  const db = getAdminDb();
  const [contentSnapshot, routesSnapshot] = await Promise.all([
    db.collection(COLLECTION).get(),
    db.collection("portfolio_routes").orderBy("order", "asc").get(),
  ]);

  const contentMap = new Map<string, { thumbnail?: string; tags?: string[]; filmedAt?: string; brandNames?: string[] }>();
  for (const doc of contentSnapshot.docs) {
    const data = doc.data() as PageContent;
    let thumb: string | undefined;
    for (const block of data.blocks ?? []) {
      if (block.type === "image") {
        const img = (block.media ?? []).find((m) => m.type === "image");
        if (img) { thumb = img.url; break; }
      }
    }
    contentMap.set(doc.id, {
      thumbnail: thumb,
      tags: data.tags,
      filmedAt: data.filmedAt,
      brandNames: (data.brands ?? []).map((b) => b.name),
    });
  }

  const cards: ProjectCard[] = [];
  for (const doc of routesSnapshot.docs) {
    const data = doc.data();
    if (data.hidden || data.hideFromHome) continue;
    const slug = (data.route as string)?.replace(/^\//, "");
    if (!slug) continue;
    const content = contentMap.get(slug);
    cards.push({
      slug,
      label: data.label as string,
      thumbnail: content?.thumbnail,
      tags: content?.tags,
      filmedAt: content?.filmedAt,
      brandNames: content?.brandNames,
      pinned: !!data.pinned,
    });
  }

  // Pinned projects first, then original order
  cards.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return cards;
}

export async function getAllMedia(
  page: number = 1,
  pageSize: number = 30
): Promise<CollectionsResponse> {
  const db = getAdminDb();
  const [contentSnapshot, routesSnapshot] = await Promise.all([
    db.collection(COLLECTION).get(),
    db.collection("portfolio_routes").get(),
  ]);

  const routeMap = new Map<string, { label: string; hidden: boolean }>();
  for (const doc of routesSnapshot.docs) {
    const data = doc.data();
    const slug = (data.route as string)?.replace(/^\//, "");
    if (slug) routeMap.set(slug, { label: data.label as string, hidden: !!data.hidden });
  }

  const allItems: CollectionItem[] = [];

  for (const doc of contentSnapshot.docs) {
    const slug = doc.id;
    const route = routeMap.get(slug);
    if (route?.hidden) continue;
    const projectName = route?.label ?? slug;
    const data = doc.data() as PageContent;

    for (const block of data.blocks ?? []) {
      if (block.type !== "image") continue;
      for (const media of block.media ?? []) {
        if (media.type !== "image") continue;
        allItems.push({
          url: media.url,
          title: media.title,
          date: media.date,
          projectSlug: slug,
          projectName,
        });
      }
    }
  }

  // Sort by date descending, undated items last
  allItems.sort((a, b) => {
    if (a.date && b.date) return b.date.localeCompare(a.date);
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });

  const total = allItems.length;
  const start = (page - 1) * pageSize;
  const items = allItems.slice(start, start + pageSize);

  return {
    items,
    total,
    page,
    pageSize,
    hasMore: start + pageSize < total,
  };
}
