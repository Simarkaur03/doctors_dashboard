"use client";

import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { BackLink } from "../../../components/ui/BackLink";
import { PageContainer } from "../../../components/ui/PageContainer";

export default function PatientReportsPage() {
  return (
    <AuthGuard requiredRole="patient">
      <PageContainer>
        <BackLink href="/patient/dashboard" />
        <Card>
          <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
          {/* TODO: Health report uploads are disabled (Firebase Storage removed). */}
        </Card>
      </PageContainer>
    </AuthGuard>
  );
}
