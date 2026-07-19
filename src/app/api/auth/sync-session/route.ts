import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
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
  } catch {
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
