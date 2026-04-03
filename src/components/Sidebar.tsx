'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { addNavItem, updateNavItem, removeNavItem } from '@/store/nav';
import { NavItem } from '@/lib/types';
import { buildRouteConfig } from '@/routeConfig/routeConfig';
import { useTenant } from '@/components/TenantProvider';
import AddRouteForm from '@/components/forms/route/AddRouteForm';
import Skeleton from '@/components/common/Skeleton';
import RouteLoaderIndicator from '@/components/common/RouteLoader';

function groupBySectionName(items: NavItem[]): [string, NavItem[]][] {
  const map = new Map<string, NavItem[]>();
  for (const item of items) {
    const key = item.sectionName || '__default__';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return [...map.entries()];
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.nav);
  const { isAuthenticated, uid: authUid, role } = useAppSelector((s) => s.auth);
  const { displayName, tagline, userId: tenantUserId } = useTenant();
  const isAdmin = isAuthenticated && (role === "superAdmin" || authUid === tenantUserId);
  const pathname = usePathname();
  const [isAdding, setIsAdding] = useState(false);

  const visibleItems = isAdmin ? items : items.filter((i) => !i.hidden);
  const routeConfig = buildRouteConfig(visibleItems, displayName, tagline);
  const sections = groupBySectionName(routeConfig);

  const handleAdd = (data: { label: string; sectionName: string }) => {
    const route = data.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    dispatch(
      addNavItem({
        route: `/${route}`,
        label: data.label,
        hidden: false,
        isNotLink: false,
        sectionName: data.sectionName,
        order: items.length,
      })
    );
    setIsAdding(false);
  };

  const footerIdx = sections.findIndex(([name]) => name === '__footer__');
  const addRouteAfterIdx = footerIdx > 0 ? footerIdx - 1 : sections.length - 1;

  return (
    <nav className="flex flex-col h-full font-mono text-sm">
      {error && <span className="text-red-500 text-[10px]">{error}</span>}

      {sections.map(([sectionName, sectionItems], idx, arr) => {
        const isTitle = sectionName === '__title__';
        const isFooter = sectionName === '__footer__';

        let spacing = '';
        if (isTitle) spacing = 'pb-2';
        else if (isFooter) spacing = 'mt-auto pt-10';
        else spacing = 'mt-6';

        return (
          <div
            key={sectionName}
            className={`${spacing} ${isFooter ? 'flex flex-col gap-3' : ''}`}
          >
            {sectionItems.map((item) => {
              const isActive = pathname === item.route;

              if (item.isNotLink) {
                return <div key={item.id}>{item.label}</div>;
              }

              if (item.id === '__title__') {
                return (
                  <div key={item.id} className="flex items-start gap-2">
                    <Link
                      href={item.route}
                      onClick={onNavigate}
                      className="block uppercase tracking-wider text-white text-xs xl:text-sm font-bold leading-tight"
                    >
                      {item.label}
                    </Link>
                    <RouteLoaderIndicator />
                  </div>
                );
              }

              const isFirestoreItem = !item.id.startsWith('__');

              return (
                <div
                  key={item.id}
                  className="group flex items-center gap-1.5 py-1"
                >
                  <Link
                    href={item.route}
                    onClick={onNavigate}
                    className={`transition-colors flex-1 ${
                      isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
                    } ${item.hidden ? 'opacity-40 line-through' : ''}`}
                  >
                    {item.label}
                  </Link>
                  {isAdmin && isFirestoreItem && (
                    <span className="flex md:hidden group-hover:flex items-center gap-1 shrink-0">
                      <button
                        onClick={() =>
                          dispatch(
                            updateNavItem({
                              id: item.id,
                              data: { hidden: !item.hidden },
                            })
                          )
                        }
                        className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                        title={item.hidden ? 'Show route' : 'Hide route'}
                      >
                        {item.hidden ? (
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
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
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
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => dispatch(removeNavItem(item.id))}
                        className="text-zinc-600 hover:text-red-400 transition-colors cursor-pointer"
                        title="Delete route"
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
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6" />
                          <path d="M14 11v6" />
                          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              );
            })}

            {isTitle && loading && items.length === 0 && (
              <div className="flex flex-col gap-4 mt-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            )}

            {idx === addRouteAfterIdx && isAdmin && (
              <>
                {isAdding && (
                  <AddRouteForm
                    onAdd={handleAdd}
                    onCancel={() => setIsAdding(false)}
                  />
                )}
                {!isAdding && (
                  <button
                    onClick={() => setIsAdding(true)}
                    className="mt-2 text-left text-xs text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                  >
                    + Add Route
                  </button>
                )}
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}
