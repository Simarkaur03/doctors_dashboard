import Link from "next/link";

export const metadata = {
  title: "MediCare Clinic - Welcome",
};

export default function LandingPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF3D5] px-4 py-16">
      <section className="w-full max-w-2xl rounded-[32px] bg-white p-8 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)] sm:p-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">MediCare Clinic</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900 sm:text-4xl">Modern care, simplified scheduling</h1>
            <p className="mt-3 max-w-xl text-sm text-slate-600 sm:text-base">Secure appointments, clear updates, and a calming experience for every patient and clinician.</p>
          </div>
          <div className="rounded-2xl bg-[#FFF3D5] px-4 py-3 text-sm font-semibold text-[#4D694E]">WCAG-ready experience</div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link href="/patient/login" className="rounded-[24px] border border-slate-200 p-5 transition hover:border-[#4D694E] hover:shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Patient portal</h2>
            <p className="mt-2 text-sm text-slate-600">Manage appointments, reports, and care updates with confidence.</p>
          </Link>
          <Link href="/admin/login" className="rounded-[24px] border border-slate-200 p-5 transition hover:border-[#4D694E] hover:shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Staff access</h2>
            <p className="mt-2 text-sm text-slate-600">Support clinicians with secure scheduling and operations oversight.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
