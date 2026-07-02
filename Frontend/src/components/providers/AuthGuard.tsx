"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth/AuthContext";

export function AuthGuard({
  children,
  requiredRole,
}: {
  children: React.ReactNode;
  requiredRole?: "patient" | "doctor" | "admin";
}) {
  const { user, role, loading, emailVerified } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/patient/login");
      return;
    }
    if (!emailVerified) {
      router.replace("/verify-email");
      return;
    }
    if (requiredRole && role !== requiredRole) {
      if (role === "admin") router.replace("/admin/dashboard");
      else if (role === "doctor") router.replace("/doctor/dashboard");
      else if (role === "patient") router.replace("/patient/dashboard");
      else router.replace("/forbidden");
    }
  }, [loading, user, role, emailVerified, requiredRole, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF3D5] px-4">
        <div className="rounded-[28px] bg-white p-8 text-center shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-[#4D694E]/20 border-t-[#4D694E]" />
          <p className="text-sm font-medium text-slate-700">Preparing your workspace…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (!emailVerified) return null;
  if (requiredRole && role !== requiredRole) return null;

  return <>{children}</>;
}
