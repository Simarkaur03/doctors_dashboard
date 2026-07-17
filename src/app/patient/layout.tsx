"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { CalendarDays, Home, ListChecks, LogOut, User } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { Logo } from "../../components/ui/Logo";

const navItems = [
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
      <div className="flex min-h-screen items-center justify-center bg-sage-light">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage/30 border-t-sage"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-light text-slate-900">
      <div className="md:flex md:min-h-screen">
        <aside className="hidden w-full max-w-xs shrink-0 border-r border-slate-200 bg-white px-4 py-6 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:justify-between md:overflow-y-auto">
          <div>
            <Logo />
            <nav className="mt-6 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage focus-visible:ring-offset-2 ${
                      isActive ? "bg-sage text-white shadow-sm" : "text-slate-700 hover:bg-sage/10"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>
        </aside>

        <main className="min-h-screen flex-1 pb-20 md:px-6 md:py-6">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-2 py-2 md:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-xl px-2 text-[11px] font-semibold transition duration-150 ${
                  isActive ? "bg-sage text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
