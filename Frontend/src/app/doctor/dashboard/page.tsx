"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ClipboardList, Users, Bell, FileText, Settings, Loader2 } from "lucide-react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
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
    const notificationsQuery = query(collection(db, "notifications"), where("uid", "==", user.uid));

    const unsubscribeAppointments = onSnapshot(appointmentsQuery, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Appointment, "id">) }));
      setAppointments(data);
      setStats({
        appointments: data.length,
        patients: new Set(data.map((item) => item.uid)).size,
        pending: data.filter((item) => item.status === "pending").length,
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
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-6">
          <header className="flex flex-col gap-4 rounded-[32px] bg-white p-6 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)] md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">Doctor workspace</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">Care overview</h1>
              <p className="mt-2 text-sm text-slate-600">Monitor appointments, patients, and secure updates in one place.</p>
            </div>
            <Button>New note</Button>
          </header>

          <section className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Appointments", value: stats.appointments, icon: CalendarDays },
              { label: "Patients", value: stats.patients, icon: Users },
              { label: "Pending", value: stats.pending, icon: ClipboardList },
              { label: "Completed", value: stats.completed, icon: FileText },
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

          <section className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Upcoming appointments</h2>
                  <p className="text-sm text-slate-500">Live updates from Firestore.</p>
                </div>
                <Badge>Live</Badge>
              </div>
              {loading ? (
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading schedule…
                </div>
              ) : appointments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No appointments are available yet.</div>
              ) : (
                <div className="space-y-3">
                  {appointments.map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
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
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Notifications</h2>
                  <p className="text-sm text-slate-500">Recent activity.</p>
                </div>
                <Bell className="h-5 w-5 text-[#4D694E]" />
              </div>
              {notifications.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No notifications yet.</div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 4).map((notification) => (
                    <div key={notification.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-semibold text-slate-900">{notification.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{notification.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Card className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Availability</h3>
                <p className="text-sm text-slate-500">Manage service hours.</p>
              </div>
              <Settings className="h-5 w-5 text-[#4D694E]" />
            </Card>
            <Card className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Clinical notes</h3>
                <p className="text-sm text-slate-500">Keep documentation close at hand.</p>
              </div>
              <FileText className="h-5 w-5 text-[#4D694E]" />
            </Card>
          </section>
        </div>
      </main>
    </AuthGuard>
  );
}
