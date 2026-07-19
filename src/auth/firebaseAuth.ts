import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  User,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const googleProvider = new GoogleAuthProvider();

function isMobileUserAgent() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export async function register(email: string, password: string, name: string) {
  await setPersistence(auth, browserLocalPersistence);
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;
  const userDoc = {
    uid: user.uid,
    name,
    email: user.email || email,
    role: "patient",
    active: true,
  };
  await setDoc(doc(db, "users", user.uid), userDoc);
  return user;
}

export async function login(email: string, password: string) {
  await setPersistence(auth, browserLocalPersistence);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
}

/** Signs in with Google, falling back to a redirect on mobile where popups are commonly blocked. */
export async function signInWithGoogle(): Promise<User | null> {
  await setPersistence(auth, browserLocalPersistence);
  if (isMobileUserAgent()) {
    await signInWithRedirect(auth, googleProvider);
    return null;
  }
  const cred = await signInWithPopup(auth, googleProvider);
  return cred.user;
}

/** Resolves a signInWithGoogle() redirect; call on mount so mobile sign-ins pick up the result after the browser navigates back. */
export async function getGoogleRedirectResult(): Promise<User | null> {
  const result = await getRedirectResult(auth);
  return result ? result.user : null;
}

/**
 * First-time Google sign-in for patients. Firestore rules only allow a
 * self-created users/{uid} doc with role "patient", so this must never be
 * called for the staff (doctor/admin) login flow.
 */
export async function ensurePatientProfile(user: User) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: user.uid,
      name: user.displayName || user.email || "Patient",
      email: user.email || "",
      role: "patient",
      active: true,
    });
  }
}

export async function resetPassword(email: string) {
  return sendPasswordResetEmail(auth, email);
}

export async function fetchUserRole(uid: string) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return data.role as string | null;
}

export type FirebaseUser = User | null;
