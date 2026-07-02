import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFF3D5] px-4 py-16">
      <section className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">403</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Access restricted</h1>
        <p className="mt-2 text-sm text-slate-600">You do not have permission to view this area.</p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-[#4D694E] px-4 py-3 text-sm font-semibold text-white">Return home</Link>
      </section>
    </main>
  );
}
