import React, { createContext, useContext, useEffect, useState } from "react";
import { onIdTokenChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import * as firebaseAuth from "./firebaseAuth";

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
  emailVerified: boolean;
  login: (email: string, password: string) => Promise<unknown>;
  register: (email: string, password: string, name: string) => Promise<unknown>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshEmailVerified: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsub = onIdTokenChanged(auth, async (u) => {
      setUser(u);
      setRole(null);
      setEmailVerified(Boolean(u?.emailVerified));
      if (u) {
        const token = await u.getIdToken();
        setSessionCookie(token);
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setRole((data && (data.role as string)) || null);
          } else {
            setRole(null);
          }
        } catch {
          setRole(null);
        }
      } else {
        clearSessionCookie();
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const refreshEmailVerified = async () => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    const token = await auth.currentUser.getIdToken(true);
    setSessionCookie(token);
    const verified = auth.currentUser.emailVerified;
    setEmailVerified(verified);
    setUser(auth.currentUser);
    return verified;
  };

  const value: AuthContextValue = {
    user,
    role,
    loading,
    emailVerified,
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
