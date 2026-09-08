import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/constants/capsule";

const PROTECTED = [
  "/dashboard",
  "/vault",
  "/deposit",
  "/vibe",
  "/family",
  "/preview",
  "/celebrate",
  "/admin",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const needsAuth = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!needsAuth) return NextResponse.next();

  const session = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/dashboard",
    "/vault/:path*",
    "/vault",
    "/deposit/:path*",
    "/deposit",
    "/vibe/:path*",
    "/vibe",
    "/family/:path*",
    "/family",
    "/preview/:path*",
    "/preview",
    "/celebrate/:path*",
    "/celebrate",
    "/admin/:path*",
    "/admin",
  ],
};
