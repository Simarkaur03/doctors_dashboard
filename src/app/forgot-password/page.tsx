"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

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
    <main className="flex min-h-screen items-center justify-center bg-accent px-4">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <Logo />
        <h1 className="mt-4 text-center text-xl font-semibold text-slate-900">Reset Password</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          {status ? <div className="rounded-xl bg-accent p-3 text-sm text-primary">{status}</div> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Send Reset Link
          </Button>
        </form>

        <Link
          href="/patient/login"
          className="mt-4 block rounded-lg text-center text-sm font-medium text-primary transition duration-150 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  );
}
