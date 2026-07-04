"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import type { Appointment } from "../../../types";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(query(collection(db, "appointments")), (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Appointment, "id">) }));
      setAppointments(data);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <AuthGuard requiredRole="admin">
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-8">
        <div className="mx-auto max-w-7xl">
          <header className="rounded-[32px] bg-white p-6 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">Admin workspace</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Operations overview</h1>
            <p className="mt-2 text-sm text-slate-600">Review the clinic schedule and keep care delivery moving smoothly.</p>
          </header>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Recent appointments</h2>
                  <p className="text-sm text-slate-500">Live updates from Firestore.</p>
                </div>
                <Badge>Live</Badge>
              </div>
              <div className="space-y-3">
                {appointments.slice(0, 6).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div>
                      <p className="font-semibold text-slate-900">{appointment.patientName}</p>
                      <p className="text-sm text-slate-500">{appointment.doctorName} • {appointment.date} • {appointment.time}</p>
                    </div>
                    <Badge>{appointment.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <h2 className="text-xl font-semibold text-slate-900">Administrative tools</h2>
              <p className="mt-2 text-sm text-slate-500">Support patient scheduling, verify appointments, and manage communications.</p>
            </Card>
          </div>
        </div>
      </main>
    </AuthGuard>
  );
}
