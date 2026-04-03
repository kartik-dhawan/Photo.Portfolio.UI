import { getAdminDb } from "@/firebase/admin";
import { UserProfile, UserRole } from "./types";
import { setUserClaims } from "./auth";

const USERS = "users";
const USERNAMES = "usernames";

export async function getUserByUid(uid: string): Promise<UserProfile | null> {
  const db = getAdminDb();
  const doc = await db.collection(USERS).doc(uid).get();
  if (!doc.exists) return null;
  return { uid: doc.id, ...doc.data() } as UserProfile;
}

export async function getUserByUsername(
  username: string
): Promise<UserProfile | null> {
  const db = getAdminDb();
  const usernameDoc = await db.collection(USERNAMES).doc(username).get();
  if (!usernameDoc.exists) return null;
  const { userId } = usernameDoc.data() as { userId: string };
  return getUserByUid(userId);
}

export async function createUser(data: {
  uid: string;
  username: string;
  displayName: string;
  tagline: string;
  email: string;
  role: UserRole;
}): Promise<UserProfile> {
  const db = getAdminDb();
  const username = data.username.toLowerCase().replace(/[^a-z0-9-]/g, "");

  // Check username uniqueness atomically
  const usernameRef = db.collection(USERNAMES).doc(username);
  const existing = await usernameRef.get();
  if (existing.exists) throw new Error("Username already taken");

  const now = new Date().toISOString();
  const user: Omit<UserProfile, "uid"> = {
    username,
    displayName: data.displayName,
    tagline: data.tagline,
    email: data.email,
    role: data.role,
    customDomain: null,
    aboutText: "",
    socials: [],
    heroTitle: "",
    heroSubtitle: "",
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  batch.set(db.collection(USERS).doc(data.uid), user);
  batch.set(usernameRef, { userId: data.uid });
  // Create empty settings doc
  batch.set(db.doc(`portfolio_settings/${data.uid}`), {
    profilePhotoUrl: "",
  });
  await batch.commit();

  // Set Firebase custom claims
  await setUserClaims(data.uid, { role: data.role, username });

  return { uid: data.uid, ...user };
}

export async function updateUser(
  uid: string,
  data: Partial<Omit<UserProfile, "uid" | "username" | "createdAt">>
): Promise<void> {
  const db = getAdminDb();
  await db
    .collection(USERS)
    .doc(uid)
    .update({ ...data, updatedAt: new Date().toISOString() });
}

export async function getAllUsers(): Promise<UserProfile[]> {
  const db = getAdminDb();
  const snapshot = await db.collection(USERS).get();
  return snapshot.docs.map(
    (doc) => ({ uid: doc.id, ...doc.data() } as UserProfile)
  );
}

export async function getUserByDomain(
  domain: string
): Promise<{ userId: string; username: string } | null> {
  const db = getAdminDb();
  const doc = await db.collection("domain_mappings").doc(domain).get();
  if (!doc.exists) return null;
  return doc.data() as { userId: string; username: string };
}
