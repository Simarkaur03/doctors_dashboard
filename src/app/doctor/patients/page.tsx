"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Loader2, Search, User } from "lucide-react";
import { db } from "../../../lib/firebase";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { PageContainer } from "../../../components/ui/PageContainer";

interface PatientRow {
  uid: string;
  name: string;
  email: string;
  phone?: string;
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(query(collection(db, "users"), where("role", "==", "patient")), (snapshot) => {
      setPatients(
        snapshot.docs.map((d) => {
          const data = d.data();
          return { uid: d.id, name: data.name || "Unnamed patient", email: data.email || "", phone: data.phone || "" };
        })
      );
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return patients;
    return patients.filter(
      (patient) => patient.name.toLowerCase().includes(term) || patient.email.toLowerCase().includes(term)
    );
  }, [patients, search]);

  return (
    <AuthGuard requiredRole="doctor">
      <PageContainer>
        <h1 className="text-xl font-semibold text-slate-900">Patients</h1>

        <div className="relative max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search"
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Card>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-slate-500">No patients found.</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((patient) => (
                <Link
                  key={patient.uid}
                  href={`/doctor/patients/${patient.uid}`}
                  className="flex items-center gap-3 rounded-xl p-3 transition duration-150 hover:bg-slate-50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-slate-900">{patient.name}</p>
                    <p className="truncate text-sm text-slate-500">{patient.email}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </PageContainer>
    </AuthGuard>
  );
}
