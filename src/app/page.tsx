import Link from "next/link";
import { Logo } from "../components/ui/Logo";

export const metadata = {
  title: "MediCare Clinic",
};

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF3D5] px-4">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <Logo />
        <div className="mt-6 flex flex-col gap-3">
          <Link
            href="/patient/login"
            className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-900 transition hover:border-[#4D694E]"
          >
            Patient Login
          </Link>
          <Link
            href="/admin/login"
            className="rounded-xl border border-slate-200 py-3 text-center text-sm font-semibold text-slate-900 transition hover:border-[#4D694E]"
          >
            Staff Login
          </Link>
        </div>
      </section>
    </main>
  );
}
