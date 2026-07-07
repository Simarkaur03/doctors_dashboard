"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, BellRing, FileText, Loader2 } from "lucide-react";
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

    const appointmentsQuery = query(collection(db, "appointments"), where("patientId", "==", user.uid));
    const notificationsQuery = query(collection(db, "notifications"), where("userId", "==", user.uid));

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
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            <div className="flex gap-2">
              <Link href="/patient/notifications" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:border-[#4D694E]" aria-label="Notifications">
                <BellRing className="h-4 w-4" />
              </Link>
              <Link href="/patient/reports" className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 hover:border-[#4D694E]" aria-label="Reports">
                <FileText className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <section className="grid gap-3 md:grid-cols-2">
            {[
              { label: "Upcoming visits", value: appointments.filter((item) => item.status !== "cancelled").length, icon: CalendarDays },
              { label: "Unread notifications", value: notifications.filter((item) => !item.read).length, icon: BellRing },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.label} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{item.label}</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{item.value}</p>
                    </div>
                    <Icon className="h-5 w-5 text-[#4D694E]" />
                  </div>
                </Card>
              );
            })}
          </section>

          <Card className="p-4">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-slate-500">No appointments yet.</p>
            ) : (
              <div className="space-y-2">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3">
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
        </div>
      </main>
    </AuthGuard>
  );
}
