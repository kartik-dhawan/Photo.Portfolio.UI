import { getAdminDb } from "@/firebase/admin";
import { Brand, ContentBlock, PageContent } from "@/store/content/types";

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

  await ref.set({
    slug,
    blocks,
    brands: brands ?? [],
    updatedAt: now,
    createdAt: existing.exists ? existing.data()!.createdAt : now,
  });
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

  const routeMap = new Map<string, string>();
  for (const doc of routesSnapshot.docs) {
    const data = doc.data();
    const slug = (data.route as string)?.replace(/^\//, "");
    if (slug) routeMap.set(slug, data.label as string);
  }

  const brands: BrandWithProject[] = [];

  for (const doc of contentSnapshot.docs) {
    const data = doc.data() as PageContent;
    if (data.brands) {
      const projectName = routeMap.get(data.slug) ?? data.slug;
      for (const brand of data.brands) {
        brands.push({
          ...brand,
          projectSlug: data.slug,
          projectName,
        });
      }
    }
  }

  return brands;
}
