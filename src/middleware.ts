import { NextRequest, NextResponse } from "next/server";

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN ?? "localhost";
const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get("host") ?? "";

  // Strip port for local dev
  const domain = hostname.split(":")[0];
  const isMainDomain =
    domain === MAIN_DOMAIN ||
    domain === "localhost" ||
    domain.endsWith(".vercel.app");

  if (isMainDomain) {
    // Root / → rewrite to default user's home
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = `/${DEFAULT_USERNAME}`;
      return NextResponse.rewrite(url);
    }

    // Check if first segment could be a username
    // Skip known static paths
    const firstSegment = pathname.split("/")[1];
    const staticPaths = ["api", "_next", "favicon.ico", "home-meta-image.png", "sitemap.xml", "robots.txt", "manifest.webmanifest"];
    if (staticPaths.includes(firstSegment)) {
      return NextResponse.next();
    }

    // If path is like /slug (no username prefix), rewrite to /defaultUsername/slug
    // This handles backward compat for existing bookmarked URLs
    // We detect this by checking: if the path has only one segment, it could be
    // either a username or a slug. We'll let it pass through to [username]/page.tsx
    // which will handle both cases.
    return NextResponse.next();
  }

  // Custom domain: prepend the resolved username
  // For now, custom domain lookup is handled by the [username] layout
  // via x-custom-domain header
  const response = NextResponse.next();
  response.headers.set("x-custom-domain", domain);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
