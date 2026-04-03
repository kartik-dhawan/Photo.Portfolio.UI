"use client";

import { useEffect } from "react";
import { useAppSelector } from "@/store";
import { useTenant } from "./TenantProvider";

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

/**
 * Redirects regular admins (no custom domain) to /{username} when they land on /
 * Only triggers when:
 * - User is logged in
 * - User is NOT super admin
 * - User's username !== default username (they're viewing someone else's home)
 * - Current tenant is the default user (meaning they're on /)
 */
export default function AdminRedirect() {
  const { isAuthenticated, role, username } = useAppSelector((s) => s.auth);
  const { username: tenantUsername } = useTenant();

  useEffect(() => {
    if (
      isAuthenticated &&
      role === "admin" &&
      username &&
      username !== DEFAULT_USERNAME &&
      tenantUsername === DEFAULT_USERNAME
    ) {
      window.location.href = `/${username}`;
    }
  }, [isAuthenticated, role, username, tenantUsername]);

  return null;
}
