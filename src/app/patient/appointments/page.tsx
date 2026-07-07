"use client";

import { AuthGuard } from "../../../components/providers/AuthGuard";
import MyAppointments from "../../../components/MyAppointments";

export default function PatientAppointmentsPage() {
  return (
    <AuthGuard requiredRole="patient">
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-8">
        <div className="mx-auto max-w-4xl">
          <MyAppointments />
        </div>
      </main>
    </AuthGuard>
  );
}
