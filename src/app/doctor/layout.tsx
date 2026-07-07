"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { CalendarClock, CalendarDays, Home, LogOut, Users } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { db } from "../../lib/firebase";
import { Logo } from "../../components/ui/Logo";

const navItems = [
  { label: "Dashboard", href: "/doctor/dashboard", icon: Home },
  { label: "Availability", href: "/doctor/availability", icon: CalendarClock },
  { label: "Appointments", href: "/doctor/appointments", icon: CalendarDays },
  { label: "Patients", href: "/doctor/patients", icon: Users },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading, logout } = useAuth();
  const [checkingSetup, setCheckingSetup] = useState(true);

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/admin/login");
      return;
    }
    if (role && role !== "doctor" && role !== "admin") {
      router.replace("/forbidden");
    }
  }, [loading, user, role, router]);

  useEffect(() => {
    if (loading || !user || role !== "doctor" || pathname === "/doctor/setup") {
      Promise.resolve().then(() => setCheckingSetup(false));
      return;
    }
    getDoc(doc(db, "users", user.uid))
      .then((snap) => {
        const setupComplete = snap.exists() && snap.data().setupComplete === true;
        if (!setupComplete) {
          router.replace("/doctor/setup");
        }
      })
      .finally(() => setCheckingSetup(false));
  }, [loading, user, role, pathname, router]);

  if (checkingSetup) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FFF3D5]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#4D694E]/20 border-t-[#4D694E]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFF3D5]">
      <div className="md:flex md:min-h-screen">
        <aside className="hidden w-full max-w-xs shrink-0 border-r border-slate-200 bg-white px-4 py-6 md:flex md:flex-col md:justify-between">
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
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition ${
                      isActive ? "bg-[#4D694E] text-white" : "text-slate-700 hover:bg-[#4D694E]/10"
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
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>
        </aside>

        <div className="flex justify-end px-4 pt-3 md:hidden">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-red-600 shadow-sm"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

        <main className="min-h-screen flex-1 pb-20 md:px-6 md:py-6">{children}</main>
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
                className={`flex min-h-[48px] flex-1 flex-col items-center justify-center rounded-xl px-2 text-[11px] font-semibold transition ${
                  isActive ? "bg-[#4D694E] text-white" : "text-slate-500 hover:bg-slate-100"
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
