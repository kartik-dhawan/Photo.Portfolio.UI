import { getAdminDb } from "@/firebase/admin";

const DOC_PATH = "portfolio_settings/general";

export async function getSettings(): Promise<{ profilePhotoUrl: string }> {
  const db = getAdminDb();
  const doc = await db.doc(DOC_PATH).get();
  if (!doc.exists) return { profilePhotoUrl: "" };
  return doc.data() as { profilePhotoUrl: string };
}

export async function updateSettings(
  data: Partial<{ profilePhotoUrl: string }>
): Promise<void> {
  const db = getAdminDb();
  const ref = db.doc(DOC_PATH);
  const existing = await ref.get();
  if (existing.exists) {
    await ref.update(data);
  } else {
    await ref.set({ profilePhotoUrl: "", ...data });
  }
}
