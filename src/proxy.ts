import { NextRequest, NextResponse } from "next/server";

const DEFAULT_USERNAME = process.env.NEXT_PUBLIC_DEFAULT_USERNAME ?? "kartik";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const segments = pathname.split("/").filter(Boolean);

  // Skip static paths
  const firstSegment = segments[0];
  const staticPaths = ["api", "_next", "favicon.ico", "home-meta-image.png", "sitemap.xml", "robots.txt", "manifest.webmanifest"];
  if (firstSegment && staticPaths.includes(firstSegment)) {
    return NextResponse.next();
  }

  // Root / → default user's home
  if (segments.length === 0) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_USERNAME}`;
    return NextResponse.rewrite(url);
  }

  // Let everything else through to [username] layout
  // The layout resolves: if first segment is a user → their portfolio
  // If not a user → treat as slug for default user
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
