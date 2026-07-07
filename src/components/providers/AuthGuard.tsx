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
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/patient/login");
      return;
    }
    if (requiredRole && role !== requiredRole) {
      if (role === "admin") router.replace("/admin/dashboard");
      else if (role === "doctor") router.replace("/doctor/dashboard");
      else if (role === "patient") router.replace("/patient/dashboard");
      else router.replace("/forbidden");
    }
  }, [loading, user, role, requiredRole, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF3D5] px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4D694E]/20 border-t-[#4D694E]" />
      </div>
    );
  }

  if (!user) return null;
  if (requiredRole && role !== requiredRole) return null;

  return <>{children}</>;
}
