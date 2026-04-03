import { NextRequest, NextResponse } from "next/server";

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN ?? "localhost";
const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

// Known usernames cached at edge. In production, sync this via edge config.
// For now, we use a simple heuristic: if the URL has only 1 path segment,
// it's either a username (their home) or an old-format slug.
// The [username]/layout.tsx handles "user not found" gracefully.
// For backward compat, we prepend default username for known sub-routes.
const SUB_ROUTES = ["about"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  const domain = hostname.split(":")[0];
  const isMainDomain =
    domain === MAIN_DOMAIN ||
    domain === "localhost" ||
    domain.endsWith(".vercel.app");

  if (isMainDomain) {
    const segments = pathname.split("/").filter(Boolean);

    // Root / → default user's home
    if (segments.length === 0) {
      const url = request.nextUrl.clone();
      url.pathname = `/${DEFAULT_USERNAME}`;
      return NextResponse.rewrite(url);
    }

    // Skip static paths
    const firstSegment = segments[0];
    const staticPaths = ["api", "_next", "favicon.ico", "home-meta-image.png", "sitemap.xml", "robots.txt", "manifest.webmanifest"];
    if (staticPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // /about → /defaultUsername/about (known sub-routes)
    if (segments.length === 1 && SUB_ROUTES.includes(firstSegment)) {
      const url = request.nextUrl.clone();
      url.pathname = `/${DEFAULT_USERNAME}/${firstSegment}`;
      return NextResponse.rewrite(url);
    }

    // If 2+ segments, assume /{username}/{slug} — let it through
    if (segments.length >= 2) {
      return NextResponse.next();
    }

    // 1 segment: could be a username OR an old slug like /portraits
    // Try as username first (the layout handles "not found").
    // But also support old URLs: if firstSegment is NOT the default username,
    // we can't know if it's a username or slug without DB.
    // Let it pass to [username] — if user not found, the layout shows 404.
    // Users will use /username/slug going forward.
    return NextResponse.next();
  }

  // Custom domain
  const response = NextResponse.next();
  response.headers.set("x-custom-domain", domain);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
