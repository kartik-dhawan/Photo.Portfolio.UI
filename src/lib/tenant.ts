import { getUserByUsername, getUserByUid } from "./users";

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";
const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID ?? "";

/**
 * Get the default user ID.
 * Checks DEFAULT_USER_ID first (direct), then falls back to username lookup.
 */
export async function getDefaultUserId(): Promise<string> {
  if (DEFAULT_USER_ID) return DEFAULT_USER_ID;
  const user = await getUserByUsername(DEFAULT_USERNAME);
  if (user) return user.uid;
  return "";
}

export { DEFAULT_USERNAME };
