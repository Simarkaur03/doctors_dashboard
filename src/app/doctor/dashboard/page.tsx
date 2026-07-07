"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, Users, FileText, Loader2 } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import type { DashboardStats, Appointment, NotificationItem } from "../../../types";

export default function DoctorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ appointments: 0, patients: 0, pending: 0, completed: 0 });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;

    const appointmentsQuery = query(collection(db, "appointments"), where("doctorId", "==", user.uid));
    const notificationsQuery = query(collection(db, "notifications"), where("userId", "==", user.uid));

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Appointment, "id">) }));
      setAppointments(data);
      setStats({
        appointments: data.length,
        patients: new Set(data.map((item) => item.patientId)).size,
        pending: data.filter((item) => item.status === "booked").length,
        completed: data.filter((item) => item.status === "completed").length,
      });
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
    <AuthGuard requiredRole="doctor">
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4">
          <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>

          <section className="grid gap-3 md:grid-cols-4">
            {[
              { label: "Appointments", value: stats.appointments, icon: CalendarDays },
              { label: "Patients", value: stats.patients, icon: Users },
              { label: "Pending", value: stats.pending, icon: ClipboardList },
              { label: "Completed", value: stats.completed, icon: FileText },
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

          <section className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
            <Card>
              <h2 className="mb-3 text-base font-semibold text-slate-900">Upcoming Appointments</h2>
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
                        <p className="font-semibold text-slate-900">{appointment.patientName}</p>
                        <p className="text-sm text-slate-500">{appointment.date} • {appointment.time}</p>
                      </div>
                      <Badge>{appointment.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <h2 className="mb-3 text-base font-semibold text-slate-900">Notifications</h2>
              {notifications.length === 0 ? (
                <p className="text-sm text-slate-500">No notifications.</p>
              ) : (
                <div className="space-y-2">
                  {notifications.slice(0, 4).map((notification) => (
                    <div key={notification.id} className="rounded-xl bg-slate-50 p-3">
                      <p className="font-semibold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
