import { getAdminDb } from "../firebase/admin";
import { FirestoreNavItem } from "./types";

const COLLECTION = "portfolio_routes";

export async function getNavItems(userId: string): Promise<FirestoreNavItem[]> {
  const db = getAdminDb();
  const snapshot = await db
    .collection(COLLECTION)
    .where("userId", "==", userId)
    .orderBy("order", "asc")
    .get();
  return snapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() } as FirestoreNavItem)
  );
}

export async function addNavItem(
  userId: string,
  item: Omit<FirestoreNavItem, "id">
): Promise<string> {
  const db = getAdminDb();
  const docRef = await db
    .collection(COLLECTION)
    .add({ ...item, userId });
  return docRef.id;
}

export async function updateNavItem(
  id: string,
  data: Partial<Omit<FirestoreNavItem, "id">>
): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(id).update(data);
}

export async function deleteNavItem(id: string): Promise<void> {
  const db = getAdminDb();
  await db.collection(COLLECTION).doc(id).delete();
}
