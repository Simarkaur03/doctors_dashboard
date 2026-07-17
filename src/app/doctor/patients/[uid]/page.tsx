"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { Loader2, Mail, Phone, User as UserIcon } from "lucide-react";
import { db } from "../../../../lib/firebase";
import { AuthGuard } from "../../../../components/providers/AuthGuard";
import { Card } from "../../../../components/ui/Card";
import { Badge } from "../../../../components/ui/Badge";
import { BackLink } from "../../../../components/ui/BackLink";
import type { Appointment } from "../../../../lib/firestore-schema";

interface PatientProfile {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
}

export default function DoctorPatientProfilePage() {
  const params = useParams<{ uid: string }>();
  const uid = params.uid;
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "users", uid))
      .then((snap) => {
        if (!snap.exists() || snap.data().role !== "patient") {
          setNotFound(true);
          return;
        }
        const data = snap.data();
        setProfile({
          name: data.name || "Unnamed patient",
          email: data.email || "",
          phone: data.phone || "",
          dateOfBirth: data.dateOfBirth || "",
        });
      })
      .finally(() => setLoading(false));
  }, [uid]);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(query(collection(db, "appointments"), where("patientId", "==", uid)), (snapshot) => {
      const data = snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Appointment, "id">) }));
      data.sort((a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`));
      setAppointments(data);
    });
    return () => unsubscribe();
  }, [uid]);

  return (
    <AuthGuard requiredRole="doctor">
      <main className="bg-[#FFF3D5] p-4 md:p-6">
        <div className="mx-auto max-w-4xl space-y-4">
          <BackLink href="/doctor/patients" label="Back to patients" />

          {loading ? (
            <Card>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            </Card>
          ) : notFound || !profile ? (
            <Card>
              <p className="text-sm text-slate-600">Patient not found.</p>
            </Card>
          ) : (
            <>
              <Card>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF3D5] text-[#4D694E]">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <h1 className="text-lg font-semibold text-slate-900">{profile.name}</h1>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-[#4D694E]" /> {profile.email || "—"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-[#4D694E]" /> {profile.phone || "—"}
                  </div>
                  {profile.dateOfBirth ? (
                    <div className="text-sm text-slate-600">DOB: {profile.dateOfBirth}</div>
                  ) : null}
                </div>
              </Card>

              <Card>
                <h2 className="mb-3 text-base font-semibold text-slate-900">Appointments</h2>
                {appointments.length === 0 ? (
                  <p className="text-sm text-slate-500">No appointments yet.</p>
                ) : (
                  <div className="space-y-2">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                      >
                        <div>
                          <p className="font-semibold text-slate-900">
                            {appointment.date} • {appointment.time}
                          </p>
                          {appointment.reason ? <p className="text-sm text-slate-500">{appointment.reason}</p> : null}
                        </div>
                        <Badge>{appointment.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </div>
      </main>
    </AuthGuard>
  );
}
