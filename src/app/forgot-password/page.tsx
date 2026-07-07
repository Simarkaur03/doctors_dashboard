"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await resetPassword(email.trim());
    } catch {
      // Ignore errors (including user-not-found) so the response can't be used to enumerate accounts.
    } finally {
      setStatus("If an account exists for that email, reset instructions have been sent.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF3D5] px-4 py-16">
      <section className="mx-auto flex max-w-md flex-col rounded-[32px] bg-white p-8 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">Password reset</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Recover access</h1>
        <p className="mt-2 text-sm text-slate-600">Enter your email and we’ll send a secure reset link.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          {status ? <div className="rounded-2xl bg-[#FFF3D5] p-3 text-sm text-[#4D694E]">{status}</div> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Sending" : "Send reset link"}
          </Button>
        </form>

        <Link href="/patient/login" className="mt-6 text-sm font-medium text-[#4D694E]">Back to sign in</Link>
      </section>
    </main>
  );
}
