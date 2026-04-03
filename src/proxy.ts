import { NextRequest, NextResponse } from "next/server";

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN ?? "localhost";
const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

// Custom domain → username mapping (synced manually or via edge config)
// Format: "customdomain.com": "username"
const DOMAIN_MAP: Record<string, string> = JSON.parse(
  process.env.DOMAIN_MAP ?? "{}"
);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";
  const domain = hostname.split(":")[0];

  const segments = pathname.split("/").filter(Boolean);

  // Skip static paths
  const firstSegment = segments[0];
  const staticPaths = ["api", "_next", "favicon.ico", "home-meta-image.png", "sitemap.xml", "robots.txt", "manifest.webmanifest", "admin"];
  // Sub-routes that belong to the default user (not usernames)
  const defaultSubRoutes = ["about", "settings"];
  if (firstSegment && staticPaths.includes(firstSegment)) {
    return NextResponse.next();
  }

  const isMainDomain =
    domain === MAIN_DOMAIN ||
    domain === "localhost" ||
    domain.endsWith(".vercel.app");

  if (isMainDomain) {
    // Root / → default user's home
    if (segments.length === 0) {
      const url = request.nextUrl.clone();
      url.pathname = `/${DEFAULT_USERNAME}`;
      return NextResponse.rewrite(url);
    }

    // /about, /settings → rewrite to /{defaultUsername}/about, etc.
    if (segments.length === 1 && defaultSubRoutes.includes(firstSegment)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${DEFAULT_USERNAME}/${firstSegment}`;
      return NextResponse.rewrite(url);
    }

    // Let [username] layout handle the rest
    return NextResponse.next();
  }

  // Custom domain — resolve username from DOMAIN_MAP
  const mappedUsername = DOMAIN_MAP[domain];
  if (mappedUsername) {
    const url = request.nextUrl.clone();
    if (segments.length === 0) {
      url.pathname = `/${mappedUsername}`;
    } else {
      url.pathname = `/${mappedUsername}/${segments.join("/")}`;
    }
    return NextResponse.rewrite(url);
  }

  // Unknown domain — show default
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_USERNAME}${pathname}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
