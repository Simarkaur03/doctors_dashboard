"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { bootstrapFirstAdmin } from "../../lib/adminApi";
import { useAuth } from "../../auth/AuthContext";
import { mapAuthError } from "../../auth/loginErrors";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";

export default function BootstrapAdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBootstrap = async () => {
    setSubmitting(true);
    setStatus(null);
    setError(null);
    try {
      await bootstrapFirstAdmin();
      setStatus("You are now an admin. Sign in again at the staff login to continue.");
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return null;
  if (!user) {
    router.replace("/patient/login?redirect=/bootstrap-admin");
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-accent px-4 py-16">
      <Card className="w-full max-w-md text-center">
        <div className="flex justify-center text-primary">
          <ShieldCheck className="h-12 w-12" />
        </div>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">One-time admin setup</h1>
        <p className="mt-2 text-sm text-slate-600">
          This only works once — the first account to click below becomes the admin. If an admin already
          exists, this will fail.
        </p>
        <div className="mt-6">
          <Button className="w-full" onClick={handleBootstrap} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Make {user.email} the admin
          </Button>
        </div>
        {status ? <div className="mt-4 rounded-2xl bg-primary/10 p-3 text-sm text-primary">{status}</div> : null}
        {error ? <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
      </Card>
    </main>
  );
}
