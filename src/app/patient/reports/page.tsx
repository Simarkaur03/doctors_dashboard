"use client";

import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";

export default function PatientReportsPage() {
  return (
    <AuthGuard requiredRole="patient">
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-6">
        <div className="mx-auto max-w-2xl">
          <Card>
            <h1 className="text-xl font-semibold text-slate-900">Reports</h1>
            {/* TODO: Health report uploads are disabled (Firebase Storage removed). */}
          </Card>
        </div>
      </main>
    </AuthGuard>
  );
}
