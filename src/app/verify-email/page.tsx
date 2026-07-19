"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { resolvePostLoginRedirect, mapAuthError } from "../../auth/loginErrors";
import { Button } from "../../components/ui/Button";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  const { user, role, loading, resendVerification, refreshEmailVerified, emailVerified, logout } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/patient/login");
      return;
    }
    if (emailVerified) {
      router.replace(resolvePostLoginRedirect(user, role));
    }
  }, [loading, user, emailVerified, role, router]);

  useEffect(() => {
    return () => {
      if (cooldownTimer.current) clearInterval(cooldownTimer.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    cooldownTimer.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1 && cooldownTimer.current) {
          clearInterval(cooldownTimer.current);
        }
        return Math.max(0, s - 1);
      });
    }, 1000);
  };

  const checkVerified = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const verified = await refreshEmailVerified();
      if (!verified) {
        setStatus("Still not verified — check your inbox (and spam folder).");
      }
    } catch {
      setError("Could not check verification status. Try again.");
    } finally {
      setChecking(false);
    }
  }, [refreshEmailVerified]);

  useEffect(() => {
    const onFocus = () => {
      if (!emailVerified) checkVerified();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [emailVerified, checkVerified]);

  const handleResend = async () => {
    if (cooldown > 0) return;
    setSending(true);
    setError(null);
    setStatus(null);
    try {
      await resendVerification();
      setStatus("A fresh verification email has been sent.");
      startCooldown();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSending(false);
    }
  };

  if (loading || !user || emailVerified) {
    return null;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF3D5] px-4 py-16">
      <section className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]">
        <div className="flex justify-center text-[#4D694E]">
          <CheckCircle2 className="h-12 w-12" />
        </div>
        <h1 className="mt-4 text-center text-3xl font-semibold text-slate-900">Verify your email</h1>
        <p className="mt-2 text-center text-sm text-slate-600">
          We sent a verification link to <span className="font-medium">{user.email}</span>. Please confirm
          it to continue.
        </p>
        <div className="mt-6 space-y-3">
          <Button className="w-full" onClick={checkVerified} disabled={checking}>
            {checking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {checking ? "Checking" : "I've verified — continue"}
          </Button>
          <Button className="w-full" onClick={handleResend} disabled={sending || cooldown > 0}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {sending ? "Sending" : cooldown > 0 ? `Resend email (${cooldown}s)` : "Resend verification email"}
          </Button>
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full justify-center text-sm font-medium text-[#4D694E]"
          >
            Sign out
          </button>
          <Link href="/patient/login" className="flex justify-center text-sm text-slate-500">
            Back to sign in
          </Link>
        </div>
        {status ? <div className="mt-4 rounded-2xl bg-[#FFF3D5] p-3 text-sm text-[#4D694E]">{status}</div> : null}
        {error ? <div className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-600">{error}</div> : null}
      </section>
    </main>
  );
}
