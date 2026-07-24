"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Home, ListChecks, User } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { DashboardShell, type NavItem } from "../../components/ui/DashboardShell";

const navItems: NavItem[] = [
  { label: "Home", href: "/patient/dashboard", icon: Home },
  { label: "Book", href: "/patient/book", icon: CalendarDays },
  { label: "Appointments", href: "/patient/appointments", icon: ListChecks },
  { label: "Profile", href: "/patient/profile", icon: User },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, logout } = useAuth();
  const isLoginPage = pathname === "/patient/login";

  const handleLogout = async () => {
    await logout();
    router.replace("/patient/login");
  };

  useEffect(() => {
    if (!isLoginPage && !loading && !user) {
      router.replace("/patient/login");
    }
  }, [isLoginPage, loading, user, router]);

  useEffect(() => {
    if (!isLoginPage && !loading && user && role && role !== "patient") {
      router.replace("/");
    }
  }, [isLoginPage, loading, role, user, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-accent">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      </div>
    );
  }

  return (
    <DashboardShell navItems={navItems} onSignOut={handleLogout}>
      {children}
    </DashboardShell>
  );
}
