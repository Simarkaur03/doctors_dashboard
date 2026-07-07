"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../auth/AuthContext";
import { login, fetchUserRole } from "../../../auth/firebaseAuth";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

export default function AdminLoginPage() {
  const { logout, user, role } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && role === "admin") router.replace("/admin/dashboard");
    else if (user && role === "doctor") router.replace("/doctor/dashboard");
  }, [user, role, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const signedInUser = await login(email.trim(), password);
      const signedInRole = await fetchUserRole(signedInUser.uid);
      if (signedInRole === "admin") router.replace("/admin/dashboard");
      else if (signedInRole === "doctor") router.replace("/doctor/dashboard");
      else {
        await logout();
        setError("This login is for staff accounts only.");
      }
    } catch {
      setError("We couldn't sign you in. Please verify your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF3D5] px-4 py-16">
      <section className="w-full max-w-md rounded-[32px] bg-white p-8 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">Staff login</p>
          <h1 className="mt-3 text-3xl font-semibold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-600">Secure access for doctors and administrators.</p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <div className="relative">
            <Input label="Password" type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} required />
            <button type="button" className="absolute right-3 top-11 rounded-full p-2 text-slate-500 hover:bg-slate-100" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error ? <div className="rounded-2xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Signing in" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 flex flex-col gap-2 text-sm text-slate-600">
          <Link href="/forgot-password" className="font-medium text-[#4D694E]">Forgot password?</Link>
          <Link href="/patient/login" className="font-medium text-[#4D694E]">Patient login</Link>
        </div>
      </section>
    </main>
  );
}
