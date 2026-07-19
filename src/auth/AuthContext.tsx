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
  emailVerified: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, name: string) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshEmailVerified: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  // Tracks the last (uid, role) pair we already asked the server to sync
  // into the signed __role cookie, so a token refresh (roughly hourly)
  // doesn't re-trigger the request once it's already in sync for this session.
  const lastSyncedRef = useRef<string | null>(null);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      setUser(u);
      setRole(null);
      setEmailVerified(Boolean(u?.emailVerified));
      if (u) {
        const token = await u.getIdToken();
        setSessionCookie(token);
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
        setRole(firestoreRole);

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
      } else {
        lastSyncedRef.current = null;
        clearSessionCookie();
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const refreshEmailVerified = async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const verified = auth.currentUser.emailVerified;
    setEmailVerified(verified);
    if (verified) {
      const token = await auth.currentUser.getIdToken(true);
      setSessionCookie(token);
    }
    return verified;
  };

  const value: AuthContextValue = {
    user,
    role,
    emailVerified,
    loading,
    login: (email, password) => firebaseAuth.login(email, password),
    register: (email, password, name) => firebaseAuth.register(email, password, name),
    logout: () => firebaseAuth.logout(),
    resetPassword: (email) => firebaseAuth.resetPassword(email),
    resendVerification: () => firebaseAuth.resendVerification(),
    refreshEmailVerified,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
