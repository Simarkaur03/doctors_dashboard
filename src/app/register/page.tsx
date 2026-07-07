"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth/AuthContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Logo } from "../../components/ui/Logo";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(email.trim(), password, name.trim());
      router.replace("/patient/dashboard");
    } catch {
      setError("Could not create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF3D5] px-4">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <Logo />
        <h1 className="mt-4 text-center text-xl font-semibold text-slate-900">Create Account</h1>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} required />
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
            Create Account
          </Button>
        </form>

        <Link href="/patient/login" className="mt-4 block text-center text-sm font-medium text-[#4D694E]">
          Already have an account?
        </Link>
      </section>
    </main>
  );
}
