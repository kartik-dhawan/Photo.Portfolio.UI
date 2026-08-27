'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector, useAppDispatch } from '@/store';
import { addNavItem, updateNavItem, removeNavItem, swapOrder } from '@/store/nav';
import { NavItem } from '@/lib/types';
import { buildRouteConfig } from '@/routeConfig/routeConfig';
import { useTenant } from '@/components/TenantProvider';
import AddRouteForm from '@/components/forms/route/AddRouteForm';
import Skeleton from '@/components/common/Skeleton';
import RouteLoaderIndicator from '@/components/common/RouteLoader';
import { sectionGroupKey, sectionSlug } from '@/lib/section-name';

type SectionGroup = { key: string; heading: string; items: NavItem[] };

function groupBySectionName(items: NavItem[]): SectionGroup[] {
  const map = new Map<string, SectionGroup>();
  for (const item of items) {
    const raw = item.sectionName ?? "";
    const key = sectionGroupKey(raw);
    const existing = map.get(key);
    if (existing) {
      existing.items.push(item);
    } else {
      const heading =
        key === "__default__" || key.startsWith("__") ? key : raw.trim() || key;
      map.set(key, { key, heading, items: [item] });
    }
  }
  return [...map.values()];
}

function ScrollIndicator({ visible }: { visible: boolean }) {
  return (
    <div
      className={`pointer-events-none absolute bottom-0 left-0 right-0 flex flex-col items-center pb-1 transition-opacity duration-200 ${visible ? 'opacity-100' : 'opacity-0'}`}
    >
      <div className="w-6 border-t border-zinc-700" />
      <svg
        width="10"
        height="6"
        viewBox="0 0 10 6"
        fill="none"
        className="text-zinc-700 mt-1"
      >
        <polyline points="1 1 5 5 9 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

export default function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const dispatch = useAppDispatch();
  const { items, loading, error } = useAppSelector((s) => s.nav);
  const { isAuthenticated, uid: authUid, role } = useAppSelector((s) => s.auth);
  const { displayName, tagline, userId: tenantUserId, prefixRoute } = useTenant();
  const isAdmin = isAuthenticated && (role === "superAdmin" || authUid === tenantUserId);
  const pathname = usePathname();
  const [isAdding, setIsAdding] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [showIndicator, setShowIndicator] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setShowIndicator(el.scrollHeight > el.clientHeight + el.scrollTop + 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll, { passive: true });
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      ro.disconnect();
    };
  }, [checkScroll]);

  useEffect(() => { checkScroll(); }, [items, checkScroll]);

  const visibleItems = isAdmin ? items : items.filter((i) => !i.hidden);
  const firestoreItems = items.filter((i) => !i.id.startsWith('__'));
  const routeConfig = buildRouteConfig(visibleItems, displayName, tagline);
  const sections = groupBySectionName(routeConfig);

  const isViewingOtherUser = role === "superAdmin" && authUid !== tenantUserId;

  const titleSections = sections.filter((s) => s.key === '__title__');
  const footerSections = sections.filter((s) => s.key === '__footer__');
  const scrollableSections = sections.filter((s) => s.key !== '__title__' && s.key !== '__footer__');

  function renderNavItem(item: NavItem) {
    const isActive = pathname === prefixRoute(item.route);
    const isFirestoreItem = !item.id.startsWith('__');

    if (item.isNotLink) {
      return <div key={item.id}>{item.label}</div>;
    }

    if (item.id === '__title__') {
      return (
        <div key={item.id} className="flex items-start gap-2">
          <Link
            href={prefixRoute(item.route)}
            onClick={onNavigate}
            className="block uppercase tracking-wider text-white text-xs xl:text-sm font-bold leading-tight"
          >
            {item.label}
          </Link>
          <RouteLoaderIndicator />
        </div>
      );
    }

    return (
      <div key={item.id} className="group flex items-center gap-1.5 py-1">
        <Link
          href={prefixRoute(item.route)}
          onClick={onNavigate}
          className={`transition-colors flex-1 ${
            isActive ? 'text-white' : 'text-zinc-400 hover:text-white'
          } ${item.hidden ? 'opacity-40 line-through' : ''}`}
        >
          {item.label}
        </Link>
        {isAdmin && isFirestoreItem && (
          <span className="flex md:hidden group-hover:flex items-center gap-1 shrink-0">
            {firestoreItems.findIndex((i) => i.id === item.id) > 0 && (
              <button
                onClick={() => {
                  const idx = firestoreItems.findIndex((i) => i.id === item.id);
                  const swap = firestoreItems[idx - 1];
                  dispatch(swapOrder({ idA: item.id, idB: swap.id }));
                  dispatch(updateNavItem({ id: item.id, data: { order: swap.order } }));
                  dispatch(updateNavItem({ id: swap.id, data: { order: item.order } }));
                }}
                className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                title="Move up"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
            )}
            {firestoreItems.findIndex((i) => i.id === item.id) < firestoreItems.length - 1 && (
              <button
                onClick={() => {
                  const idx = firestoreItems.findIndex((i) => i.id === item.id);
                  const swap = firestoreItems[idx + 1];
                  dispatch(swapOrder({ idA: item.id, idB: swap.id }));
                  dispatch(updateNavItem({ id: item.id, data: { order: swap.order } }));
                  dispatch(updateNavItem({ id: swap.id, data: { order: item.order } }));
                }}
                className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
                title="Move down"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            )}
            <button
              onClick={() =>
                dispatch(updateNavItem({ id: item.id, data: { hidden: !item.hidden } }))
              }
              className="text-zinc-600 hover:text-zinc-300 transition-colors cursor-pointer"
              title={item.hidden ? 'Show route' : 'Hide route'}
            >
              {item.hidden ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                  <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
  }

  return (
    <nav className="flex flex-col h-full font-mono text-sm">

      {/* ── Fixed top: title + superAdmin back link ── */}
      <div className="shrink-0 pb-2">
        {isViewingOtherUser && (
          <a
            href="/"
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-[10px] uppercase tracking-wider transition-colors mb-4 pb-3 border-b border-zinc-800"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to home
          </a>
        )}
        {error && <span className="text-red-500 text-[10px]">{error}</span>}
        {titleSections.map(({ key, items: sectionItems }) => (
          <div key={key}>
            {sectionItems.map((item) => renderNavItem(item))}
          </div>
        ))}
      </div>

      {/* ── Scrollable middle ── */}
      <div className="flex-1 relative min-h-0">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto scrollbar-none"
        >
          <div className="flex flex-col gap-0 mt-6">
            {scrollableSections.map(({ key, heading, items: sectionItems }) => {
              const showSectionHeading = key !== '__default__';
              return (
                <div key={key} className="mt-6 first:mt-0">
                  {showSectionHeading && (
                    <Link
                      href={prefixRoute(`/sec/${sectionSlug(heading)}`)}
                      onClick={onNavigate}
                      className="text-[10px] uppercase tracking-wider text-zinc-600 hover:text-zinc-300 font-mono mb-1 transition-colors block"
                    >
                      {heading}
                    </Link>
                  )}
                  {sectionItems.map((item) => renderNavItem(item))}
                </div>
              );
            })}

            {loading && items.length === 0 && (
              <div className="flex flex-col gap-4 mt-6">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-16" />
              </div>
            )}

            {isAdmin && (
              <div className="mt-2">
                {isAdding && (
                  <AddRouteForm
                    onAdd={(data) => {
                      const route = data.label.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                      dispatch(addNavItem({
                        route: `/${route}`,
                        label: data.label,
                        hidden: false,
                        isNotLink: false,
                        sectionName: data.sectionName,
                        order: items.length,
                      }));
                      setIsAdding(false);
                    }}
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
              </div>
            )}

            {/* bottom padding so last item isn't flush against the indicator */}
            <div className="h-6" />
          </div>
        </div>

        <ScrollIndicator visible={showIndicator} />
      </div>

      {/* ── Fixed bottom: footer ── */}
      <div className="shrink-0 pt-6 flex flex-col gap-3">
        {footerSections.map(({ key, items: sectionItems }) => (
          <div key={key}>
            {sectionItems.map((item) => renderNavItem(item))}
          </div>
        ))}
      </div>

    </nav>
  );
}
