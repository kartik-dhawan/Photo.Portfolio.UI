"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProjectCard as ProjectCardType } from "@/lib/content";
import { useAppSelector, useAppDispatch } from "@/store";
import { updateNavItem } from "@/store/nav";
import { useTenant } from "@/components/TenantProvider";
import { sectionSlug, sectionGroupKey } from "@/lib/section-name";

interface Props {
  project: ProjectCardType;
}

export default function ProjectCard({ project }: Props) {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { isAuthenticated, uid: authUid, role } = useAppSelector((s) => s.auth);
  const { userId: tenantUserId, prefixRoute } = useTenant();
  const isAdmin = isAuthenticated && (role === "superAdmin" || authUid === tenantUserId);
  const { items: navItems } = useAppSelector((s) => s.nav);

  const navItem = navItems.find((n) => n.route === `/${project.slug}`);

  const rawSection = navItem?.sectionName;
  const sectionKey = rawSection ? sectionGroupKey(rawSection) : null;
  const showSection = rawSection && sectionKey && !sectionKey.startsWith("__");
  const sectionHref = showSection ? prefixRoute(`/sec/${sectionSlug(rawSection!)}`) : null;

  const dateBrand: string[] = [];
  if (project.filmedAt) {
    dateBrand.push(
      new Date(project.filmedAt + "T00:00:00").toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      })
    );
  }
  if (project.brandNames?.length) dateBrand.push(project.brandNames.join(", "));
  const dateBrandLine = dateBrand.join(" — ");
  const tagsLine = project.tags?.join(", ");

  const handleToggle = (
    e: React.MouseEvent,
    field: "pinned" | "hideFromHome"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!navItem) return;
    const newValue = !navItem[field];
    const data: Record<string, boolean | number> = { [field]: newValue };
    if (newValue && field === "pinned") { data.hideFromHome = false; data.pinnedAt = Date.now(); }
    if (!newValue && field === "pinned") data.pinnedAt = 0;
    if (newValue && field === "hideFromHome") data.pinned = false;
    dispatch(updateNavItem({ id: navItem.id, data }));
  };

  const isPinned = !!navItem?.pinned;
  const isHidden = !!navItem?.hideFromHome;

  return (
    <Link
      href={`/${project.slug}`}
      className="group block relative overflow-hidden rounded aspect-[4/3] bg-zinc-900"
    >
      {project.thumbnail ? (
        <Image
          src={project.thumbnail}
          alt={project.label}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          quality={75}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTgxODE4Ii8+PC9zdmc+"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-zinc-700 text-xs font-mono">
          No media
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
        <div className="p-4 flex flex-col gap-1 w-full">
          {showSection && sectionHref && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); router.push(sectionHref); }}
              className="self-start text-[9px] font-mono uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {rawSection}
            </button>
          )}
          <div className="flex items-center gap-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 opacity-60 md:hidden"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
            <p className="text-white text-sm md:text-base font-mono uppercase tracking-wider">
              {project.label}
            </p>
          </div>
          {dateBrandLine && (
            <p className="text-zinc-400 text-[10px] md:text-xs font-mono truncate">
              {dateBrandLine}
            </p>
          )}
          {tagsLine && (
            <p className="text-zinc-500 text-[10px] font-mono truncate">
              {tagsLine}
            </p>
          )}
        </div>
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="absolute top-2 left-2 flex gap-1">
          <button
            onClick={(e) => handleToggle(e, "pinned")}
            className={`p-1.5 rounded backdrop-blur-sm transition-colors cursor-pointer ${
              isPinned
                ? "bg-white/20 text-white"
                : "bg-black/40 text-zinc-400 hover:text-white"
            }`}
            title={isPinned ? "Unpin" : "Pin to top"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={isPinned ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 17v5" />
              <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76z" />
            </svg>
          </button>
          <button
            onClick={(e) => handleToggle(e, "hideFromHome")}
            className={`p-1.5 rounded backdrop-blur-sm transition-colors cursor-pointer ${
              isHidden
                ? "bg-red-500/20 text-red-400"
                : "bg-black/40 text-zinc-400 hover:text-white"
            }`}
            title={isHidden ? "Show on home" : "Hide from home"}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isHidden ? (
                <>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </>
              ) : (
                <>
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              )}
            </svg>
          </button>
        </div>
      )}

      {/* Folder icon on hover */}
      <div className="absolute top-0 right-0 bottom-0 w-12 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <line x1="12" y1="11" x2="12" y2="17" />
          <line x1="9" y1="14" x2="15" y2="14" />
        </svg>
      </div>
    </Link>
  );
}
