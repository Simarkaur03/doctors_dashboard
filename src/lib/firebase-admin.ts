import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

function buildApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

  if (useEmulators) {
    // The emulators accept any project id and need no credentials; the SDK
    // talks to them once these host env vars are set instead of prod GCP.
    process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
    return initializeApp({ projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID });
  }

  // Accepts either naming scheme: FIREBASE_ADMIN_* (this repo's convention)
  // or the bare service-account field names (project_id/client_email/
  // private_key), which is how these are already configured in Vercel.
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.project_id;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.client_email;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.private_key)?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials (FIREBASE_ADMIN_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY " +
        "or project_id/client_email/private_key)"
    );
  }

  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

// Lazy: route handlers call adminAuth()/adminDb() at request time, not at
// module load, so `next build`'s page-data collection (which imports every
// route module without real env vars present) doesn't fail the build.
let cachedAuth: Auth | null = null;
let cachedDb: Firestore | null = null;

export function adminAuth(): Auth {
  if (!cachedAuth) cachedAuth = getAuth(buildApp());
  return cachedAuth;
}

export function adminDb(): Firestore {
  if (!cachedDb) cachedDb = getFirestore(buildApp());
  return cachedDb;
}
