"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { DashboardShell, type NavItem } from "../../components/ui/DashboardShell";

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: Home },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const isLoginPage = pathname === "/admin/login";

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  // The staff login lives under /admin but must render without the dashboard
  // chrome.
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
