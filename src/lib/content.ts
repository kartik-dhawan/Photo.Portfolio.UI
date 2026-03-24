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

export async function updatePageBrands(
  slug: string,
  brands: Brand[]
): Promise<void> {
  const db = getAdminDb();
  const ref = db.collection(COLLECTION).doc(slug);
  const existing = await ref.get();
  if (existing.exists) {
    await ref.update({ brands });
  } else {
    await ref.set({
      slug,
      blocks: [],
      brands,
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
