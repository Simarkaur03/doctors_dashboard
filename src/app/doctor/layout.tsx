"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { CalendarClock, CalendarDays, Home, Users } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { db } from "../../lib/firebase";
import { DashboardShell, type NavItem } from "../../components/ui/DashboardShell";

const navItems: NavItem[] = [
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
