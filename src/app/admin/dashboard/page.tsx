"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query } from "firebase/firestore";
import { LogOut } from "lucide-react";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import type { Appointment } from "../../../types";

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

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
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
            <Button variant="secondary" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>

          <Card>
            <h2 className="mb-3 text-base font-semibold text-slate-900">Appointments</h2>
            {appointments.length === 0 ? (
              <p className="text-sm text-slate-500">No appointments.</p>
            ) : (
              <div className="space-y-2">
                {appointments.slice(0, 6).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between rounded-xl bg-slate-50 p-3 transition-colors duration-150 hover:bg-slate-100">
                    <div>
                      <p className="font-semibold text-slate-900">{appointment.patientName}</p>
                      <p className="text-sm text-slate-500">{appointment.doctorName} • {appointment.date} • {appointment.time}</p>
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
