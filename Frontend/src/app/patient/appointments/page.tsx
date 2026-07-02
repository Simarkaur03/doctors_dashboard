"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import type { Appointment } from "../../../types";

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(query(collection(db, "appointments"), where("uid", "==", user.uid)), (snapshot) => {
      setAppointments(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Appointment, "id">) })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <AuthGuard requiredRole="patient">
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">Appointments</p>
                <h1 className="mt-2 text-3xl font-semibold text-slate-900">Your visit history</h1>
              </div>
              <Badge>Live</Badge>
            </div>
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading appointments…
              </div>
            ) : appointments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">No appointments yet.</div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="flex flex-col gap-2 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
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
