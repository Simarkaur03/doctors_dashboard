"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../auth/AuthContext";
import { login, fetchUserRole } from "../../../auth/firebaseAuth";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Logo } from "../../../components/ui/Logo";

type StaffRole = "doctor" | "admin";

export default function AdminLoginPage() {
  const { logout, user, role } = useAuth();
  const router = useRouter();
  const [staffRole, setStaffRole] = useState<StaffRole>("doctor");
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
      setError("Incorrect email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF3D5] px-4">
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
                staffRole === option ? "bg-white text-[#4D694E] shadow-sm" : "text-slate-500"
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
            <button type="button" className="absolute right-3 top-11 rounded-full p-2 text-slate-500 hover:bg-slate-100" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password visibility">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error ? <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {staffRole === "admin" ? "Admin Login" : "Doctor Login"}
          </Button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="rounded-lg font-medium text-[#4D694E] transition duration-150 hover:text-[#3c5140] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D694E] focus-visible:ring-offset-2">Forgot Password</Link>
          <Link href="/patient/login" className="rounded-lg font-medium text-[#4D694E] transition duration-150 hover:text-[#3c5140] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D694E] focus-visible:ring-offset-2">Patient login</Link>
        </div>
      </section>
    </main>
  );
}
