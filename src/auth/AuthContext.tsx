import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import * as firebaseAuth from "./firebaseAuth";
import { syncSession } from "../lib/adminApi";

function setSessionCookie(token: string) {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `__session=${token}; path=/; max-age=3600; SameSite=Lax${secure}`;
}

function clearSessionCookie() {
  document.cookie = "__session=; path=/; max-age=0";
}

type AuthContextValue = {
  user: User | null;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  loginWithGoogle: () => Promise<User | null>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // Tracks the last (uid, role) pair we already asked the server to sync
  // into the signed __role cookie, so a token refresh (roughly hourly)
  // doesn't re-trigger the request once it's already in sync for this session.
  const lastSyncedRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      // Re-arm `loading` for every auth transition, not just the initial
      // mount — `useState(true)` only covers the first call. Without this,
      // signing in from an already-mounted page (loading already false from
      // the initial signed-out check) leaves consumers seeing
      // `{loading: false, user, role: null}` for the entire Firestore/
      // sync-session round trip and bounces a valid user to /forbidden.
      setLoading(true);
      setUser(u);
      setRole(null);
      // try/finally guarantees `loading` always resolves — otherwise a
      // rejected getIdToken()/getDoc() (e.g. a network blip) would leave the
      // app stuck on the loading spinner forever.
      try {
        if (u) {
          let token: string | null = null;
          try {
            token = await u.getIdToken();
          } catch {
            token = null;
          }
          if (token) setSessionCookie(token);
          let firestoreRole: string | null = null;
          try {
            const snap = await getDoc(doc(db, "users", u.uid));
            if (snap.exists()) {
              const data = snap.data();
              firestoreRole = (data && (data.role as string)) || null;
            }
          } catch {
            firestoreRole = null;
          }
          if (firestoreRole) {
            const syncKey = `${u.uid}:${firestoreRole}`;
            if (lastSyncedRef.current !== syncKey) {
              lastSyncedRef.current = syncKey;
              try {
                await syncSession();
              } catch {
                // Non-fatal: the user still functions with Firestore-sourced
                // role for client-side UI; edge role-gating just won't see
                // it until the next successful sync attempt.
                lastSyncedRef.current = null;
              }
            }
          }

          // Exposed only now, after the __role cookie sync above has settled:
          // pages redirect to role-gated routes (/admin, /doctor) the instant
          // `role` becomes non-null, and middleware checks that same cookie on
          // the very next navigation. Setting it earlier lets that redirect
          // race ahead of the cookie write and bounce a legitimate user to
          // /forbidden right after login.
          setRole(firestoreRole);
        } else {
          lastSyncedRef.current = null;
          clearSessionCookie();
        }
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const value: AuthContextValue = {
    user,
    role,
    loading,
    login: (email, password) => firebaseAuth.login(email, password),
    loginWithGoogle: () => firebaseAuth.signInWithGoogle(),
    register: (email, password, name) => firebaseAuth.register(email, password, name),
    logout: () => firebaseAuth.logout(),
    resetPassword: (email) => firebaseAuth.resetPassword(email),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
