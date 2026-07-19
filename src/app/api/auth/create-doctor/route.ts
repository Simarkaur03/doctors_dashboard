import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as crypto from "crypto";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";

/**
 * Admin-only: creates a doctor account. The admin is provisioning someone
 * else, so the new account gets a random temp password; the caller (client)
 * is expected to immediately send a password-reset email so the doctor sets
 * their own password via Firebase's default email template.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!idToken) {
    return NextResponse.json({ code: "unauthenticated", message: "Missing ID token" }, { status: 401 });
  }

  let callerUid: string;
  try {
    const decoded = await adminAuth().verifyIdToken(idToken);
    callerUid = decoded.uid;
  } catch {
    return NextResponse.json({ code: "unauthenticated", message: "Invalid or expired session" }, { status: 401 });
  }

  const callerDoc = await adminDb().collection("users").doc(callerUid).get();
  if (callerDoc.data()?.role !== "admin") {
    return NextResponse.json(
      { code: "permission-denied", message: "Only admins can create doctor accounts" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = (typeof body.email === "string" ? body.email : "").trim().toLowerCase();
  const name = (typeof body.name === "string" ? body.name : "").trim();

  if (!email) {
    return NextResponse.json({ code: "invalid-argument", message: "Email is required" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ code: "invalid-argument", message: "Name is required" }, { status: 400 });
  }

  const tempPassword = crypto.randomBytes(24).toString("base64url");

  let uid: string;
  try {
    const created = await adminAuth().createUser({ email, password: tempPassword, displayName: name });
    uid = created.uid;
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "auth/email-already-exists") {
      return NextResponse.json(
        { code: "already-exists", message: "An account with this email already exists" },
        { status: 409 }
      );
    }
    if (code === "auth/invalid-email") {
      return NextResponse.json({ code: "invalid-argument", message: "Enter a valid email address" }, { status: 400 });
    }
    return NextResponse.json({ code: "internal", message: "Could not create the account" }, { status: 500 });
  }

  // Deliberately omits setupComplete so the existing /doctor/setup first-run
  // flow (src/app/doctor/layout.tsx) still fires for this new doctor.
  await adminDb().collection("users").doc(uid).set({
    uid,
    name,
    email,
    role: "doctor",
    active: true,
  });

  return NextResponse.json({ uid, email });
}
