"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth/AuthContext";

// Admin is a superset of doctor everywhere else in the app (proxy.ts's
// /doctor role gate and doctor/layout.tsx both already allow "admin"), so
// this guard must agree — otherwise an admin who passes those checks still
// gets bounced back to /admin/dashboard the moment a doctor page's own
// <AuthGuard requiredRole="doctor"> re-checks the exact role.
function satisfiesRole(role: string | null, requiredRole: "patient" | "doctor" | "admin") {
  if (role === requiredRole) return true;
  if (requiredRole === "doctor" && role === "admin") return true;
  return false;
}

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
    if (requiredRole && !satisfiesRole(role, requiredRole)) {
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
  if (requiredRole && !satisfiesRole(role, requiredRole)) return null;

  return <>{children}</>;
}
