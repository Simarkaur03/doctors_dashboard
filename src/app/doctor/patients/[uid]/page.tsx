"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { ArrowLeft, Loader2, Mail, Phone, User as UserIcon } from "lucide-react";
import { db } from "../../../../lib/firebase";
import { AuthGuard } from "../../../../components/providers/AuthGuard";
import { Card } from "../../../../components/ui/Card";
import { Badge } from "../../../../components/ui/Badge";
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
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Link href="/doctor/patients" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4D694E]">
            <ArrowLeft className="h-4 w-4" /> Back to patients
          </Link>

          {loading ? (
            <Card>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading patient…
              </div>
            </Card>
          ) : notFound || !profile ? (
            <Card>
              <p className="text-sm text-slate-600">This patient could not be found.</p>
            </Card>
          ) : (
            <>
              <Card>
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFF3D5] text-[#4D694E]">
                    <UserIcon className="h-7 w-7" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900">{profile.name}</h1>
                    <p className="text-sm text-slate-500">Patient profile</p>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-[#4D694E]" /> {profile.email || "No email on file"}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-[#4D694E]" /> {profile.phone || "No phone on file"}
                  </div>
                  {profile.dateOfBirth ? (
                    <div className="text-sm text-slate-600">Date of birth: {profile.dateOfBirth}</div>
                  ) : null}
                </div>
              </Card>

              <Card>
                <h2 className="text-xl font-semibold text-slate-900">Appointment history</h2>
                {appointments.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">
                    No appointments yet.
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {appointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 p-4"
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
