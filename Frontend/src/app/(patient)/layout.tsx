"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, CalendarDays, Home, ListChecks, User } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../lib/firebase";

const navItems = [
  { label: "Home", href: "/patient/dashboard", icon: Home },
  { label: "Book", href: "/book", icon: CalendarDays },
  { label: "Appointments", href: "/my-appointments", icon: ListChecks },
  { label: "Profile", href: "/profile", icon: User },
];

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, role, loading } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/patient/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.uid) return;

    const unreadQuery = query(
      collection(db, "notifications"),
      where("uid", "==", user.uid),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(unreadQuery, (snapshot) => {
      setUnreadCount(snapshot.size);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!loading && user && role && role !== "patient") {
      router.replace("/");
    }
  }, [loading, role, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sage-light px-4 py-20 text-center">
        <div className="inline-flex items-center justify-center rounded-3xl bg-white/90 px-6 py-8 shadow-lg shadow-slate-200/50">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-sage/30 border-t-sage"></div>
          <p className="ml-4 text-base font-medium text-slate-700">Loading your patient portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sage-light text-slate-900">
      <div className="md:flex md:min-h-screen">
        <aside className="hidden w-full max-w-xs shrink-0 border-r border-slate-200 bg-white px-6 py-8 md:block">
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sage">Patient portal</p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">Your care, simplified</p>
            </div>

            <div className="space-y-2 rounded-3xl bg-sage-light p-4">
              <p className="text-sm font-medium text-slate-700">Quick access</p>
              <div className="mt-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        isActive
                          ? "bg-sage text-white"
                          : "text-slate-700 hover:bg-sage/10"
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-slate-900">Notifications</p>
                  <p className="text-xs text-slate-500">Stay up to date with your care.</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sage/10 text-sage">
                  <Bell className="h-5 w-5" />
                </div>
              </div>
              {unreadCount > 0 ? (
                <p className="mt-4 rounded-full bg-sage/10 px-3 py-2 text-sm text-sage">
                  {unreadCount} new {unreadCount === 1 ? "message" : "messages"}
                </p>
              ) : (
                <p className="mt-4 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-500">
                  All caught up
                </p>
              )}
            </div>
          </div>
        </aside>

        <main className="min-h-screen flex-1 pb-28 md:px-8 md:py-8">
          {children}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-4px_30px_rgba(15,23,42,0.06)] md:hidden">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-[52px] flex-1 flex-col items-center justify-center rounded-2xl px-2 text-[11px] font-semibold transition ${
                  isActive ? "bg-sage text-white" : "text-slate-500 hover:bg-slate-100"
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
