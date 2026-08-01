"use client";

import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { BackLink } from "../../../components/ui/BackLink";
import { PageContainer } from "../../../components/ui/PageContainer";

export default function PatientSettingsPage() {
  return (
    <AuthGuard requiredRole="patient">
      <PageContainer width="narrow">
        <BackLink href="/patient/profile" />
        <Card>
          <h1 className="text-xl font-semibold text-slate-900">Settings</h1>
        </Card>
      </PageContainer>
    </AuthGuard>
  );
}
