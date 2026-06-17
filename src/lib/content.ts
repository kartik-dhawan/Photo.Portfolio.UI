import { getAdminDb } from "@/firebase/admin";
import { Brand, ContentBlock, PageContent, CollectionItem, CollectionsResponse, SectionNames } from "@/store/content/types";

const COLLECTION = "portfolio_content";

function contentDocId(userId: string, slug: string): string {
  return `${userId}_${slug}`;
}

export async function getPageContent(
  userId: string,
  slug: string
): Promise<PageContent | null> {
  const db = getAdminDb();
  const doc = await db.collection(COLLECTION).doc(contentDocId(userId, slug)).get();
  if (!doc.exists) return null;
  return { slug, ...doc.data() } as PageContent;
}

export async function savePageContent(
  userId: string,
  slug: string,
  blocks: ContentBlock[],
  brands?: Brand[]
): Promise<void> {
  const db = getAdminDb();
  const now = new Date().toISOString();
  const ref = db.collection(COLLECTION).doc(contentDocId(userId, slug));
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
      userId,
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
  userId: string,
  slug: string,
  settings: { brands: Brand[]; tags: string[]; filmedAt: string; sectionNames?: SectionNames }
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(contentDocId(userId, slug));
  const existing = await ref.get();
  if (existing.exists) {
    await ref.update({ brands: settings.brands, tags: settings.tags, filmedAt: settings.filmedAt, sectionNames: settings.sectionNames ?? {} });
  } else {
    await ref.set({
      slug,
      userId,
      blocks: [],
      brands: settings.brands,
      tags: settings.tags,
      filmedAt: settings.filmedAt,
      sectionNames: settings.sectionNames ?? {},
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    });
  }
}

export interface BrandWithProject extends Brand {
  projectSlug: string;
  projectName: string;
}

export async function getAllBrands(userId: string): Promise<BrandWithProject[]> {
  const db = getAdminDb();
  const [contentSnapshot, routesSnapshot] = await Promise.all([
    db.collection(COLLECTION).where("userId", "==", userId).get(),
    db.collection("portfolio_routes").where("userId", "==", userId).get(),
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
    const slug = data.slug as string;
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

export async function getProjectCards(userId: string): Promise<ProjectCard[]> {
  const db = getAdminDb();
  const [contentSnapshot, routesSnapshot] = await Promise.all([
    db.collection(COLLECTION).where("userId", "==", userId).get(),
    db.collection("portfolio_routes").where("userId", "==", userId).orderBy("order", "asc").get(),
  ]);

  const contentMap = new Map<string, { thumbnail?: string; tags?: string[]; filmedAt?: string; brandNames?: string[] }>();
  for (const doc of contentSnapshot.docs) {
    const data = doc.data() as PageContent & { slug: string };
    let thumb: string | undefined;
    for (const block of data.blocks ?? []) {
      if (block.type === "image") {
        const img = (block.media ?? []).find((m) => m.type === "image");
        if (img) { thumb = img.url; break; }
      }
    }
    contentMap.set(data.slug, {
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

  cards.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  return cards;
}

export async function getProjectCardsForSection(
  userId: string,
  targetSlug: string
): Promise<{ sectionName: string; projects: ProjectCard[] } | null> {
  const { slugMatchesSection } = await import("./section-name");
  const db = getAdminDb();
  const [contentSnapshot, routesSnapshot] = await Promise.all([
    db.collection(COLLECTION).where("userId", "==", userId).get(),
    db.collection("portfolio_routes").where("userId", "==", userId).orderBy("order", "asc").get(),
  ]);

  // Find routes belonging to this section
  const sectionRoutes = routesSnapshot.docs.filter((doc) =>
    slugMatchesSection(targetSlug, doc.data().sectionName as string | undefined)
  );
  if (sectionRoutes.length === 0) return null;

  const sectionName = sectionRoutes[0].data().sectionName as string;

  const contentMap = new Map<string, { thumbnail?: string; tags?: string[]; filmedAt?: string; brandNames?: string[] }>();
  for (const doc of contentSnapshot.docs) {
    const data = doc.data() as PageContent & { slug: string };
    let thumb: string | undefined;
    for (const block of data.blocks ?? []) {
      if (block.type === "image") {
        const img = (block.media ?? []).find((m) => m.type === "image");
        if (img) { thumb = img.url; break; }
      }
    }
    contentMap.set(data.slug, {
      thumbnail: thumb,
      tags: data.tags,
      filmedAt: data.filmedAt,
      brandNames: (data.brands ?? []).map((b) => b.name),
    });
  }

  const projects: ProjectCard[] = [];
  for (const doc of sectionRoutes) {
    const data = doc.data();
    if (data.hidden) continue; // respect visibility; hideFromHome doesn't apply here
    const slug = (data.route as string)?.replace(/^\//, "");
    if (!slug) continue;
    const content = contentMap.get(slug);
    projects.push({
      slug,
      label: data.label as string,
      thumbnail: content?.thumbnail,
      tags: content?.tags,
      filmedAt: content?.filmedAt,
      brandNames: content?.brandNames,
    });
  }

  return { sectionName, projects };
}

export async function getAllSections(
  userId: string
): Promise<{ name: string; slug: string }[]> {
  const { sectionSlug, sectionGroupKey } = await import("./section-name");
  const db = getAdminDb();
  const snapshot = await db
    .collection("portfolio_routes")
    .where("userId", "==", userId)
    .orderBy("order", "asc")
    .get();

  // A section is valid only when it has at least one non-hidden route
  const sectionMap = new Map<string, { name: string; slug: string; hasVisible: boolean }>();
  for (const doc of snapshot.docs) {
    const data = doc.data();
    const raw = (data.sectionName as string | undefined)?.trim();
    if (!raw) continue;
    const key = sectionGroupKey(raw);
    if (key.startsWith("__")) continue;
    const isHidden = !!data.hidden;
    if (!sectionMap.has(key)) {
      sectionMap.set(key, { name: raw, slug: sectionSlug(raw), hasVisible: !isHidden });
    } else if (!isHidden) {
      sectionMap.get(key)!.hasVisible = true;
    }
  }
  return [...sectionMap.values()].filter((s) => s.hasVisible);
}


export async function getAllMedia(
  userId: string,
  page: number = 1,
  pageSize: number = 30
): Promise<CollectionsResponse> {
  const db = getAdminDb();
  const [contentSnapshot, routesSnapshot] = await Promise.all([
    db.collection(COLLECTION).where("userId", "==", userId).get(),
    db.collection("portfolio_routes").where("userId", "==", userId).get(),
  ]);

  const routeMap = new Map<string, { label: string; hidden: boolean; excludeFromGallery: boolean }>();
  for (const doc of routesSnapshot.docs) {
    const data = doc.data();
    const slug = (data.route as string)?.replace(/^\//, "");
    if (slug) routeMap.set(slug, { label: data.label as string, hidden: !!data.hidden, excludeFromGallery: !!data.excludeFromGallery });
  }

  const allItems: CollectionItem[] = [];

  for (const doc of contentSnapshot.docs) {
    const data = doc.data() as PageContent & { slug: string };
    const slug = data.slug;
    const route = routeMap.get(slug);
    if (route?.hidden || route?.excludeFromGallery) continue;
    const projectName = route?.label ?? slug;

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
