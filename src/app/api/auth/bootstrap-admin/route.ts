import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

/**
 * Self-disabling bootstrap: promotes the caller to admin, but only while no
 * admin account exists yet in Firestore. Once any admin exists, this always
 * fails — safe to leave reachable in the app permanently.
 */
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
    console.error("[bootstrap-admin] verifyIdToken failed:", err);
    Sentry.captureException(err, { tags: { route: "bootstrap-admin" } });
    return NextResponse.json({ code: "unauthenticated", message: "Invalid or expired session" }, { status: 401 });
  }

  const existingAdmins = await adminDb().collection("users").where("role", "==", "admin").limit(1).get();
  if (!existingAdmins.empty) {
    return NextResponse.json(
      { code: "failed-precondition", message: "An admin account already exists" },
      { status: 409 }
    );
  }

  await adminDb().collection("users").doc(uid).set({ role: "admin" }, { merge: true });

  return NextResponse.json({ role: "admin" });
}
