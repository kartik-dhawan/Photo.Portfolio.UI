"use client";

import { usePathname } from "next/navigation";
import { useTenant } from "@/components/TenantProvider";

export default function SocialLinks() {
  const pathname = usePathname();
  const { userId } = useTenant();

  // Hide on about page (socials shown inline there)
  if (pathname.endsWith("/about")) return null;
  // Hide if no tenant loaded yet
  if (!userId) return null;

  // Socials come from user profile via TenantProvider
  // For now, this component is a placeholder — socials will be
  // fetched and displayed once we add them to the tenant context.
  // The actual social links are shown on the about page.
  return null;
}
