import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import { signRoleToken, ROLE_COOKIE_NAME } from "../../../../lib/roleToken";

const ALLOWED_ROLES = new Set(["patient", "doctor", "admin"]);

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ code: "unauthenticated", message: "Missing ID token" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    uid = decoded.uid;
  } catch (err) {
    // The client's token was valid enough to reach here — a failure at this
    // step is almost always the Admin SDK itself (missing/invalid
    // FIREBASE_ADMIN_* credentials), not the user's session. Logging the
    // real cause is the only way to tell those apart; the 401 response stays
    // generic since the client shouldn't see server credential details.
    console.error("[sync-session] verifyIdToken failed:", err);
    Sentry.captureException(err, { tags: { route: "sync-session" } });
    return NextResponse.json({ code: "unauthenticated", message: "Invalid or expired session" }, { status: 401 });
  }

  const userDoc = await adminDb().collection("users").doc(uid).get();
  const rawRole = userDoc.data()?.role;
  const role = ALLOWED_ROLES.has(rawRole) ? (rawRole as string) : null;

  const token = await signRoleToken({ uid, role });

  const response = NextResponse.json({ role });
  response.cookies.set(ROLE_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 3600,
  });
  return response;
}
