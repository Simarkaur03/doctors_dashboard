"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, BellRing, UserCircle2, FileText, Loader2 } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useAuth } from "../../../auth/AuthContext";
import { db } from "../../../lib/firebase";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import type { Appointment, NotificationItem } from "../../../types";

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const appointmentsQuery = query(collection(db, "appointments"), where("uid", "==", user.uid));
    const notificationsQuery = query(collection(db, "notifications"), where("uid", "==", user.uid));

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Appointment, "id">) }));
      setAppointments(data);
      setLoading(false);
    });

    const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<NotificationItem, "id">) }));
      setNotifications(data);
    });

    return () => {
      unsubscribeAppointments();
      unsubscribeNotifications();
    };
  }, [user]);

  return (
    <AuthGuard requiredRole="patient">
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <header className="rounded-[32px] bg-white p-6 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">Patient portal</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your care overview</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">Review visits, stay informed, and manage your upcoming appointments with ease.</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href="/patient/appointments" className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#4D694E] px-4 text-sm font-semibold text-white transition hover:bg-[#415b41]">
                View appointments
              </Link>
              <Link href="/patient/reports" className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#FFF3D5] px-4 text-sm font-semibold text-[#4D694E] transition hover:bg-[#f8e8bc]">
                Health reports
              </Link>
            </div>
          </header>

          <section className="grid gap-4 md:grid-cols-3">
            {[
              { label: "Upcoming visits", value: appointments.filter((item) => item.status !== "cancelled").length, icon: CalendarDays },
              { label: "Notifications", value: notifications.filter((item) => !item.read).length, icon: BellRing },
              { label: "Saved reports", value: 2, icon: FileText },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <p className="mt-2 text-3xl font-semibold text-slate-900">{item.value}</p>
                    </div>
                    <div className="rounded-2xl bg-[#FFF3D5] p-3 text-[#4D694E]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Your appointments</h2>
                  <p className="text-sm text-slate-500">Connected to Firestore for a live view.</p>
                </div>
                <Badge>Live</Badge>
              </div>
              {loading ? (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading appointments…
                </div>
              ) : appointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No appointments yet. Book your first visit today.</div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                      <div>
                        <p className="font-semibold text-slate-900">{appointment.doctorName}</p>
                        <p className="text-sm text-slate-500">{appointment.date} • {appointment.time}</p>
                      </div>
                      <Badge>{appointment.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Quick links</h2>
                  <p className="text-sm text-slate-500">Helpful tools and updates.</p>
                </div>
                <UserCircle2 className="h-5 w-5 text-[#4D694E]" />
              </div>
              <div className="space-y-3">
                <Link href="/patient/appointments" className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-sm text-slate-600 transition hover:border-[#4D694E] hover:text-[#4D694E]">
                  <span>Appointments</span>
                  <ClipboardList className="h-4 w-4" />
                </Link>
                <Link href="/patient/notifications" className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-sm text-slate-600 transition hover:border-[#4D694E] hover:text-[#4D694E]">
                  <span>Notifications</span>
                  <BellRing className="h-4 w-4" />
                </Link>
                <Link href="/patient/reports" className="flex items-center justify-between rounded-2xl border border-slate-200 p-4 text-sm text-slate-600 transition hover:border-[#4D694E] hover:text-[#4D694E]">
                  <span>Reports</span>
                  <FileText className="h-4 w-4" />
                </Link>
              </div>
            </Card>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
