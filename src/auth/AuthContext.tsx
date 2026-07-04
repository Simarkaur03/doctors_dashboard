import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import * as firebaseAuth from "./firebaseAuth";

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
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setRole(null);
      setEmailVerified(Boolean(u?.emailVerified));
      if (u) {
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
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

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
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
