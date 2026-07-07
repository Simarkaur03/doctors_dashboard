"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { Button } from "../../components/ui/Button";

export default function VerifyEmailPage() {
  const { user, resendVerification, refreshEmailVerified, emailVerified } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const checkVerified = useCallback(async () => {
    setChecking(true);
    try {
      const verified = await refreshEmailVerified();
      if (verified) {
        router.replace("/patient/dashboard");
      }
    } finally {
      setChecking(false);
    }
  }, [refreshEmailVerified, router]);

  useEffect(() => {
    if (emailVerified) {
      router.replace("/patient/dashboard");
      return;
    }
    const onFocus = () => checkVerified();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [emailVerified, checkVerified, router]);

  const handleResend = async () => {
    setLoading(true);
    try {
      await resendVerification();
      setStatus("A fresh verification email has been sent.");
    } catch {
      setStatus("We could not send another verification email right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF3D5] px-4 py-16">
      <section className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]">
        <div className="flex justify-center text-[#4D694E]">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="mt-4 text-center text-3xl font-semibold text-slate-900">Verify your email</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          {emailVerified ? "Your email is verified." : "We sent a verification message to " + user?.email + ". Please confirm it to continue."}
        </p>
        <div className="mt-6 space-y-3">
          <Button className="w-full" onClick={checkVerified} disabled={checking}>
            {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {checking ? "Checking" : "I've verified — continue"}
          </Button>
          <Button className="w-full" onClick={handleResend} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Sending" : "Resend verification email"}
          </Button>
          <Link href="/patient/login" className="flex justify-center text-sm font-medium text-[#4D694E]">
            Back to sign in
          </Link>
        </div>
        {status ? <div className="mt-4 rounded-2xl bg-[#FFF3D5] p-3 text-sm text-[#4D694E]">{status}</div> : null}
      </section>
    </main>
  );
}
