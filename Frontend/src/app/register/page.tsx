"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth/AuthContext";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

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
      setError("We couldn’t create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FFF3D5] px-4 py-16">
      <section className="mx-auto flex max-w-md flex-col rounded-[32px] bg-white p-8 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">Create account</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Join the clinic</h1>
        <p className="mt-2 text-sm text-slate-600">Create a secure account to manage visits and updates.</p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} required />
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
            {loading ? "Creating account" : "Create account"}
          </Button>
        </form>

        <Link href="/patient/login" className="mt-6 text-sm font-medium text-[#4D694E]">Already have an account?</Link>

        <p className="mt-4 text-center text-xs text-slate-400">
          By creating an account, you agree to our{" "}
          <Link href="/terms-of-service" className="underline hover:text-[#4D694E]">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy-policy" className="underline hover:text-[#4D694E]">Privacy Policy</Link>.
        </p>
      </section>
    </main>
  );
}
