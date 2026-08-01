"use client";

import { AuthGuard } from "../../../components/providers/AuthGuard";
import MyAppointments from "../../../components/MyAppointments";
import { PageContainer } from "../../../components/ui/PageContainer";

export default function PatientAppointmentsPage() {
  return (
    <AuthGuard requiredRole="patient">
      <PageContainer>
        <MyAppointments />
      </PageContainer>
    </AuthGuard>
  );
}
