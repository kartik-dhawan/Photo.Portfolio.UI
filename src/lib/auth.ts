import { getAdminDb } from "@/firebase/admin";
import { UserRole } from "./types";

let adminAuth: import("firebase-admin/auth").Auth | null = null;

async function getAdminAuth() {
  if (!adminAuth) {
    const { getAuth } = await import("firebase-admin/auth");
    // Ensure admin app is initialized (getAdminDb does this as a side effect)
    getAdminDb();
    adminAuth = getAuth();
  }
  return adminAuth;
}

export interface AuthUser {
  uid: string;
  email: string;
  role: UserRole;
  username: string;
}

export async function verifyAuth(request: Request): Promise<AuthUser | null> {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const auth = await getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      role: (decoded.role as UserRole) ?? "admin",
      username: (decoded.username as string) ?? "",
    };
  } catch {
    return null;
  }
}

export function canEdit(authUser: AuthUser, targetUserId: string): boolean {
  return authUser.role === "superAdmin" || authUser.uid === targetUserId;
}

export async function setUserClaims(
  uid: string,
  claims: { role: UserRole; username: string }
): Promise<void> {
  const auth = await getAdminAuth();
  await auth.setCustomUserClaims(uid, claims);
}
