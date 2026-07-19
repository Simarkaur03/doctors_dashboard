import { FirebaseError } from "firebase/app";
import type { User } from "firebase/auth";
import { ApiError } from "../lib/adminApi";

const ERROR_MESSAGES: Record<string, string> = {
  // Deliberately unified (not "wrong password" vs "no such account") to
  // avoid confirming whether an email is registered.
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/wrong-password": "Incorrect email or password.",
  "auth/user-not-found": "Incorrect email or password.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/user-disabled": "This account has been disabled. Contact support.",
  "auth/too-many-requests": "Too many attempts. Please wait a bit and try again.",
  "auth/network-request-failed": "Network error. Check your connection and try again.",
  "auth/email-already-in-use": "An account with this email already exists.",
  "auth/weak-password": "Choose a stronger password (at least 6 characters).",
  // Our own Next.js API routes (src/app/api/auth/*) return these same
  // codes in their JSON body instead of Cloud Functions callable errors.
  "already-exists": "An account with this email already exists.",
  "permission-denied": "You don't have permission to do that.",
  "invalid-argument": "Check the details you entered and try again.",
  "failed-precondition": "That action isn't available right now.",
  "unauthenticated": "Please sign in again and retry.",
};

export function mapAuthError(error: unknown): string {
  if (error instanceof FirebaseError && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  if (error instanceof ApiError && error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  return "Something went wrong. Please try again.";
}

const DASHBOARD_BY_ROLE: Record<string, string> = {
  patient: "/patient/dashboard",
  doctor: "/doctor/dashboard",
  admin: "/admin/dashboard",
};

export function resolvePostLoginRedirect(user: User, role: string | null): string {
  if (!user.emailVerified) return "/verify-email";
  if (role && DASHBOARD_BY_ROLE[role]) return DASHBOARD_BY_ROLE[role];
  return "/forbidden";
}

export function sanitizeRedirectParam(raw: string | null): string | null {
  if (!raw) return null;
  if (!raw.startsWith("/")) return null;
  if (raw.startsWith("//")) return null;
  if (raw.includes("://")) return null;
  return raw;
}
