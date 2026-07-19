import { auth } from "./firebase";

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.code = code;
  }
}

async function authedFetch<T>(path: string, body?: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new ApiError("Not signed in");

  const idToken = await user.getIdToken();
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || "Request failed", data.code);
  }
  return data as T;
}

/** Reads the caller's Firestore role and stores it in a signed, httpOnly session cookie. */
export function syncSession() {
  return authedFetch<{ role: string | null }>("/api/auth/sync-session");
}

/** One-time: promotes the caller to admin while no admin account exists yet. */
export function bootstrapFirstAdmin() {
  return authedFetch<{ role: "admin" }>("/api/auth/bootstrap-admin");
}

/** Admin-only: creates a doctor account with a random temp password. */
export function createDoctorAccount(email: string, name: string) {
  return authedFetch<{ uid: string; email: string }>("/api/auth/create-doctor", { email, name });
}
