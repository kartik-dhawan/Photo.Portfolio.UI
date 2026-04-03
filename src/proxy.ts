import { NextRequest, NextResponse } from "next/server";

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN ?? "localhost";
const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

// Custom domain → username mapping
// Format: {"laiba.me":"laiba","john.com":"john"}
const DOMAIN_MAP: Record<string, string> = JSON.parse(
  process.env.DOMAIN_MAP ?? "{}"
);

function rewriteForUser(request: NextRequest, username: string): NextResponse {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);
  const url = request.nextUrl.clone();

  if (segments.length === 0) {
    url.pathname = `/${username}`;
  } else {
    url.pathname = `/${username}/${segments.join("/")}`;
  }
  return NextResponse.rewrite(url);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const domain = hostname.split(":")[0];

  const segments = pathname.split("/").filter(Boolean);
  const firstSegment = segments[0];

  // Skip static paths
  const staticPaths = ["api", "_next", "favicon.ico", "home-meta-image.png", "sitemap.xml", "robots.txt", "manifest.webmanifest"];
  if (firstSegment && staticPaths.includes(firstSegment)) {
    return NextResponse.next();
  }

  // Check if this is a custom domain
  const isMainDomain =
    domain === MAIN_DOMAIN ||
    domain === "localhost" ||
    domain.endsWith(".vercel.app");

  // Custom domain — all paths map to that user
  if (!isMainDomain) {
    const mappedUsername = DOMAIN_MAP[domain];
    if (mappedUsername) {
      return rewriteForUser(request, mappedUsername);
    }
    // Unknown domain — fall through to default user
    return rewriteForUser(request, DEFAULT_USERNAME);
  }

  // Main domain logic
  // Root / → default user's home
  if (segments.length === 0) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_USERNAME}`;
    return NextResponse.rewrite(url);
  }

  // Sub-routes for default user: /about, /settings, /admin/...
  const defaultSubRoutes = ["about", "settings", "admin"];
  if (defaultSubRoutes.includes(firstSegment)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_USERNAME}${pathname}`;
    return NextResponse.rewrite(url);
  }

  // Everything else → [username] layout handles it
  // /{username} → that user's home
  // /{username}/{slug} → that user's project
  // /{slug} → layout falls back to default user's project
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
