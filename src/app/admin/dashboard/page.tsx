"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query } from "firebase/firestore";
import { LogOut, Loader2, UserPlus } from "lucide-react";
import { db } from "../../../lib/firebase";
import { createDoctorAccount } from "../../../lib/adminApi";
import { useAuth } from "../../../auth/AuthContext";
import { resetPassword } from "../../../auth/firebaseAuth";
import { mapAuthError } from "../../../auth/loginErrors";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import type { Appointment } from "../../../types";

export default function AdminDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctorName, setDoctorName] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [invitingDoctor, setInvitingDoctor] = useState(false);
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.replace("/admin/login");
  };

  const handleInviteDoctor = async (event: React.FormEvent) => {
    event.preventDefault();
    setInviteStatus(null);
    setInviteError(null);
    setInvitingDoctor(true);
    try {
      const result = await createDoctorAccount(doctorEmail.trim(), doctorName.trim());
      await resetPassword(result.email);
      setInviteStatus(`Doctor invited — a password setup email was sent to ${result.email}.`);
      setDoctorName("");
      setDoctorEmail("");
    } catch (err) {
      setInviteError(mapAuthError(err));
    } finally {
      setInvitingDoctor(false);
    }
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

          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-slate-900">
              <UserPlus className="h-4 w-4" />
              Invite a doctor
            </h2>
            <p className="mb-3 text-sm text-slate-500">
              Doctor accounts can only be created here. The doctor gets an email to set their own password.
            </p>
            <form className="space-y-3" onSubmit={handleInviteDoctor}>
              <Input
                label="Full name"
                value={doctorName}
                onChange={(event) => setDoctorName(event.target.value)}
                required
              />
              <Input
                label="Email"
                type="email"
                value={doctorEmail}
                onChange={(event) => setDoctorEmail(event.target.value)}
                required
              />
              {inviteStatus ? (
                <div className="rounded-xl bg-[#4D694E]/10 p-3 text-sm text-[#4D694E]">{inviteStatus}</div>
              ) : null}
              {inviteError ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{inviteError}</div> : null}
              <Button type="submit" disabled={invitingDoctor}>
                {invitingDoctor ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Invite doctor
              </Button>
            </form>
          </Card>
        </div>
      </main>
    </AuthGuard>
  );
}
