import { getAdminDb } from "@/firebase/admin";

export async function getSettings(userId: string): Promise<{ profilePhotoUrl: string }> {
  const db = getAdminDb();
  const doc = await db.doc(`portfolio_settings/${userId}`).get();
  if (!doc.exists) return { profilePhotoUrl: "" };
  return doc.data() as { profilePhotoUrl: string };
}

export async function updateSettings(
  userId: string,
  data: Partial<{ profilePhotoUrl: string }>
): Promise<void> {
  const db = getAdminDb();
  const ref = db.doc(`portfolio_settings/${userId}`);
  const existing = await ref.get();
  if (existing.exists) {
    await ref.update(data);
  } else {
    await ref.set({ profilePhotoUrl: "", ...data });
  }
}
