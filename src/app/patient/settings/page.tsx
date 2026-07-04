"use client";

import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";

export default function PatientSettingsPage() {
  return (
    <AuthGuard requiredRole="patient">
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-8">
        <div className="mx-auto max-w-6xl">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">Settings</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Preferences</h1>
            <p className="mt-2 text-sm text-slate-600">Update contact details and notifications from this space.</p>
          </Card>
        </div>
      </main>
    </AuthGuard>
  );
}
