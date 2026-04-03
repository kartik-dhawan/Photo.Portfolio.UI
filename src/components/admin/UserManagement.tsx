"use client";

import Link from "next/link";
import { useAppSelector } from "@/store";
import { useTenant } from "@/components/TenantProvider";

export default function UserManagement() {
  const { role, isAuthenticated, username } = useAppSelector((s) => s.auth);
  const { prefixRoute } = useTenant();
  const isSuperAdmin = role === "superAdmin";

  if (!isAuthenticated) return null;

  const settingsHref = username ? prefixRoute("/settings") : "/settings";

  return (
    <div className="flex flex-col gap-2">
      <Link
        href={settingsHref}
        className="text-zinc-600 hover:text-zinc-400 transition-colors text-[10px] uppercase tracking-wider"
      >
        Settings
      </Link>
      {isSuperAdmin && (
        <Link
          href="/admin/users"
          className="text-zinc-600 hover:text-zinc-400 transition-colors text-[10px] uppercase tracking-wider"
        >
          Manage Users
        </Link>
      )}
    </div>
  );
}
