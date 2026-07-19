import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, createRemoteJWKSet } from "jose";
import { verifyRoleToken, ROLE_COOKIE_NAME } from "./lib/roleToken";

const publicPaths = new Set([
  "/",
  "/patient/login",
  "/admin/login",
  "/register",
  "/forgot-password",
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

type SessionClaims = {
  sub?: string;
  exp?: number;
};

function decodeUnverified(token: string): SessionClaims | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64").toString("utf8"));
    if (typeof payload.exp === "number" && payload.exp * 1000 < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

async function verifySessionToken(token: string): Promise<SessionClaims | null> {
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
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

// Role required to access each route prefix. A role not in the list is
// redirected to /forbidden. `undefined` in the allowed set below means
// "role cookie not yet synced" (e.g. first request right after sign-in,
// before the client's sync-session call lands) is tolerated for that
// prefix only. Firestore rules already default an unset role to 'patient',
// so tolerating it here too avoids locking out a legitimate patient mid-sync.
// /admin and /doctor stay fail-closed.
const ROLE_GATES: { prefix: string; allowed: Array<string | undefined> }[] = [
  { prefix: "/admin", allowed: ["admin"] },
  { prefix: "/doctor", allowed: ["doctor", "admin"] },
  { prefix: "/patient", allowed: ["patient", undefined] },
];

function roleGateFor(pathname: string) {
  return ROLE_GATES.find((gate) => pathname === gate.prefix || pathname.startsWith(gate.prefix + "/"));
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

  const gate = roleGateFor(pathname);
  if (gate) {
    // The role lives in a separate, server-signed cookie (set by
    // /api/auth/sync-session from the caller's Firestore users/{uid}.role —
    // there are no Firebase custom claims on the Spark plan). Its `sub`
    // must match this request's session uid, or it's stale/foreign.
    const roleCookie = request.cookies.get(ROLE_COOKIE_NAME)?.value;
    const roleClaims = roleCookie ? await verifyRoleToken(roleCookie) : null;
    const role = roleClaims && roleClaims.uid === claims.sub ? roleClaims.role ?? undefined : undefined;

    if (!gate.allowed.includes(role)) {
      return NextResponse.redirect(new URL("/forbidden", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
