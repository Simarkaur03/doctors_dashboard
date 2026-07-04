import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPaths = new Set([
  "/",
  "/patient/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/privacy-policy",
  "/terms-of-service",
  "/forbidden",
]);

const isPublicPath = (pathname: string) =>
  publicPaths.has(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/api");

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const hasAuthToken =
    request.cookies.has("__session") ||
    request.cookies.has("firebase-auth-token");

  if (!hasAuthToken) {
    const loginUrl = new URL("/patient/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
