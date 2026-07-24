"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { User } from "firebase/auth";
import { useAuth } from "../../../auth/AuthContext";
import { fetchUserRole, ensurePatientProfile, getGoogleRedirectResult } from "../../../auth/firebaseAuth";
import { mapAuthError, resolvePostLoginRedirect, sanitizeRedirectParam } from "../../../auth/loginErrors";
import { syncSession } from "../../../lib/adminApi";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Logo } from "../../../components/ui/Logo";
import { GoogleIcon } from "../../../components/ui/GoogleIcon";

export default function PatientLoginPage() {
  return (
    <Suspense>
      <PatientLoginContent />
    </Suspense>
  );
}

function PatientLoginContent() {
  const { login, loginWithGoogle, user, role, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Wait for AuthContext to finish resolving role — otherwise an already
    // signed-in user briefly has `role: null` (reset at the top of every
    // auth-state change, before Firestore/role-cookie sync lands) and gets
    // bounced to /forbidden by resolvePostLoginRedirect before the real
    // role is known.
    if (authLoading) return;
    if (user) router.replace(resolvePostLoginRedirect(role));
  }, [authLoading, user, role, router]);

  // This form is patient-branded, but any role can land here (e.g. a
  // staff account signing in from the wrong page). /patient/* tolerates an
  // unsynced __role cookie, so a plain patient redirect doesn't need to
  // wait — but /admin and /doctor don't, so a non-patient role must sync
  // the cookie first or the redirect races ahead of it and bounces the
  // user to /forbidden (mirrors the same guard in admin/login/page.tsx).
  const redirectAfterLogin = async (signedInRole: string | null) => {
    const redirect = sanitizeRedirectParam(searchParams.get("redirect"));
    if (signedInRole === "patient" && redirect) {
      router.replace(redirect);
      return;
    }
    if (signedInRole !== "patient") {
      await syncSession().catch(() => {});
    }
    router.replace(resolvePostLoginRedirect(signedInRole));
  };

  const completeGoogleSignIn = async (signedInUser: User) => {
    await ensurePatientProfile(signedInUser);
    const signedInRole = await fetchUserRole(signedInUser.uid);
    await redirectAfterLogin(signedInRole);
  };

  useEffect(() => {
    // Resolves a signInWithRedirect() Google sign-in on mobile, where the
    // browser navigates away and back instead of returning from a popup.
    let cancelled = false;
    getGoogleRedirectResult()
      .then((redirectUser) => {
        if (!redirectUser || cancelled) return;
        return completeGoogleSignIn(redirectUser);
      })
      .catch((err) => {
        if (!cancelled) setError(mapAuthError(err));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const signedInUser = await login(email.trim(), password);
      // Self-heals accounts that have a Firebase Auth user but no
      // users/{uid} Firestore doc yet (e.g. pre-existing accounts from
      // before this schema, or a signup whose doc write never landed) —
      // without this, fetchUserRole below returns null and
      // resolvePostLoginRedirect bounces a valid, freshly-authenticated
      // user straight to /forbidden.
      await ensurePatientProfile(signedInUser);
      const signedInRole = await fetchUserRole(signedInUser.uid);
      await redirectAfterLogin(signedInRole);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const signedInUser = await loginWithGoogle();
      if (signedInUser) {
        await completeGoogleSignIn(signedInUser);
      }
      // else: redirect flow navigated away; the effect above picks up the result on return.
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-accent px-4">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <Logo />
        <h1 className="mt-4 text-center text-xl font-semibold text-slate-900">Patient Login</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <div className="relative">
            <Input label="Password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" className="absolute right-3 top-11 rounded-full p-2 text-slate-500 hover:bg-slate-100" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <Button type="submit" className="w-full" disabled={loading || googleLoading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Patient Login
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200" />
          <span className="text-xs font-medium uppercase text-slate-400">or</span>
          <div className="h-px flex-1 bg-slate-200" />
        </div>

        <Button type="button" variant="secondary" className="w-full" disabled={loading || googleLoading} onClick={handleGoogleSignIn}>
          {googleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
          Continue with Google
        </Button>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="rounded-lg font-medium text-primary transition duration-150 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Forgot Password</Link>
          <Link href="/register" className="rounded-lg font-medium text-primary transition duration-150 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Create account</Link>
        </div>
      </section>
    </main>
  );
}
