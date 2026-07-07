import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";

const publicPaths = new Set([
  "/",
  "/patient/login",
  "/admin/login",
  "/register",
  "/forgot-password",
  "/verify-email",
  "/privacy-policy",
  "/terms-of-service",
  "/forbidden",
]);

const isPublicPath = (pathname: string) =>
  publicPaths.has(pathname) || pathname.startsWith("/_next") || pathname.startsWith("/api");

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

const JWKS = createRemoteJWKSet(
  new URL(
    "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
  )
);

function decodeUnverified(token: string): { email_verified?: boolean; sub?: string; exp?: number } | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function verifySessionToken(token: string) {
  if (!projectId) return null;

  // The Firebase Auth emulator issues tokens that aren't signed by Google, so
  // signature verification against Google's JWKS would always fail here.
  // This path only ever runs when NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true,
  // which must never be set in production.
  if (useEmulators) {
    return decodeUnverified(token);
  }

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });
    return payload as { email_verified?: boolean; sub?: string };
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("__session")?.value;
  const claims = token ? await verifySessionToken(token) : null;

  if (!claims) {
    const loginUrl = new URL("/patient/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("__session");
    return response;
  }

  if (!claims.email_verified) {
    return NextResponse.redirect(new URL("/verify-email", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
