"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, doc, onSnapshot, query, updateDoc, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { toast } from "../../../lib/toast";
import type { Appointment } from "../../../lib/firestore-schema";
import { PageContainer } from "../../../components/ui/PageContainer";

const ACTIONABLE_STATUSES = new Set(["booked", "confirmed"]);
type Filter = "upcoming" | "past" | "all";

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("upcoming");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(
      query(collection(db, "appointments"), where("doctorId", "==", user.uid)),
      (snapshot) => {
        const data = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Appointment, "id">) }));
        data.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
        setAppointments(data);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [user]);

  const filtered = useMemo(() => {
    const now = new Date();
    return appointments.filter((appointment) => {
      const when = new Date(`${appointment.date}T${appointment.time}:00`);
      if (filter === "upcoming") return when >= now && appointment.status !== "cancelled";
      if (filter === "past") return when < now || appointment.status === "cancelled";
      return true;
    });
  }, [appointments, filter]);

  const updateStatus = async (appointmentId: string, status: "completed" | "no-show") => {
    setUpdatingId(appointmentId);
    try {
      await updateDoc(doc(db, "appointments", appointmentId), {
        status,
        updatedAt: new Date().toISOString(),
      });
      toast.success(status === "completed" ? "Marked as completed." : "Marked as no-show.");
    } catch {
      toast.error("Could not update this appointment. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AuthGuard requiredRole="doctor">
      <PageContainer>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold text-slate-900">Appointments</h1>
          <div className="flex gap-2">
            {(["upcoming", "past", "all"] as Filter[]).map((option) => (
              <button
                key={option}
                onClick={() => setFilter(option)}
                className={`min-h-11 rounded-full px-4 text-sm font-semibold capitalize transition ${
                  filter === option ? "bg-primary text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <Card>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No {filter === "all" ? "" : filter} appointments.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900">{appointment.patientName}</p>
                    <p className="text-sm text-slate-500">
                      {appointment.date} • {appointment.time} • {appointment.duration} min
                    </p>
                    {appointment.reason ? <p className="mt-1 text-xs text-slate-400 break-words">Reason: {appointment.reason}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{appointment.status}</Badge>
                    {ACTIONABLE_STATUSES.has(appointment.status) ? (
                      <>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={updatingId === appointment.id}
                          onClick={() => updateStatus(appointment.id, "completed")}
                        >
                          Mark completed
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={updatingId === appointment.id}
                          onClick={() => updateStatus(appointment.id, "no-show")}
                        >
                          No-show
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageContainer>
    </AuthGuard>
  );
}
