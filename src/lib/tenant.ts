import { getUserByUsername } from "./users";

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

/**
 * Get the default (super admin) user ID.
 * Used during the transition period before full multi-tenant routing.
 */
export async function getDefaultUserId(): Promise<string> {
  const user = await getUserByUsername(DEFAULT_USERNAME);
  if (user) return user.uid;
  // Fallback: if user doc doesn't exist yet (pre-migration), return empty string
  // This allows pages to compile but they won't return data until migration runs
  return "";
}

export { DEFAULT_USERNAME };
