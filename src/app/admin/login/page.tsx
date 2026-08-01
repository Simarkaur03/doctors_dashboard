"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { User } from "firebase/auth";
import { useAuth } from "../../../auth/AuthContext";
import { login, fetchUserRole, signInWithGoogle, getGoogleRedirectResult } from "../../../auth/firebaseAuth";
import { mapAuthError } from "../../../auth/loginErrors";
import { syncSession } from "../../../lib/adminApi";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Logo } from "../../../components/ui/Logo";
import { GoogleIcon } from "../../../components/ui/GoogleIcon";

type StaffRole = "doctor" | "admin";

export default function AdminLoginPage() {
  const { logout, user, role } = useAuth();
  const router = useRouter();
  const [staffRole, setStaffRole] = useState<StaffRole>("doctor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (role === "admin") {
      router.replace("/admin/dashboard");
    } else if (role === "doctor") {
      router.replace("/doctor/dashboard");
    }
  }, [user, role, router]);

  const completeStaffGoogleSignIn = async (signedInUser: User) => {
    // Doctors/admins are only ever provisioned by an existing admin via the
    // create-doctor API — a first-time Google sign-in here must never
    // self-create a Firestore profile (Firestore rules would reject a
    // client-side create with any role other than "patient" anyway).
    const signedInRole = await fetchUserRole(signedInUser.uid);
    if (signedInRole === "admin" || signedInRole === "doctor") {
      await syncSession().catch(() => {});
      router.replace(signedInRole === "admin" ? "/admin/dashboard" : "/doctor/dashboard");
    } else {
      await logout();
      setError("Unauthorized doctor account.");
    }
  };

  useEffect(() => {
    // Resolves a signInWithRedirect() Google sign-in on mobile, where the
    // browser navigates away and back instead of returning from a popup.
    let cancelled = false;
    getGoogleRedirectResult()
      .then((redirectUser) => {
        if (!redirectUser || cancelled) return;
        return completeStaffGoogleSignIn(redirectUser);
      })
      .catch((err) => {
        if (!cancelled) setError(mapAuthError(err));
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const signedInUser = await signInWithGoogle();
      if (signedInUser) {
        await completeStaffGoogleSignIn(signedInUser);
      }
      // else: redirect flow navigated away; the effect above picks up the result on return.
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const signedInUser = await login(email.trim(), password);
      const signedInRole = await fetchUserRole(signedInUser.uid);
      if (signedInRole === "admin" || signedInRole === "doctor") {
        // Middleware gates /admin and /doctor on the __role cookie, set by
        // this call — without awaiting it, the redirect below can race
        // ahead of the cookie write and bounce a legitimate staff member
        // to /forbidden right after login.
        await syncSession().catch(() => {});
        router.replace(signedInRole === "admin" ? "/admin/dashboard" : "/doctor/dashboard");
      } else {
        await logout();
        setError("This login is for staff accounts only.");
      }
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-accent px-4">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-md">
        <Logo />
        <h1 className="mt-4 text-center text-xl font-semibold text-slate-900">Staff Login</h1>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
          {(["doctor", "admin"] as StaffRole[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setStaffRole(option)}
              className={`rounded-lg py-2 text-sm font-semibold capitalize transition ${
                staffRole === option ? "bg-white text-primary shadow-sm" : "text-slate-500"
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <div className="relative">
            <Input label="Password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" className="absolute right-2 top-7 inline-flex h-11 w-11 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <Button type="submit" className="w-full" disabled={loading || googleLoading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {staffRole === "admin" ? "Admin Login" : "Doctor Login"}
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
          <Link href="/patient/login" className="rounded-lg font-medium text-primary transition duration-150 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">Patient login</Link>
        </div>
      </section>
    </main>
  );
}
