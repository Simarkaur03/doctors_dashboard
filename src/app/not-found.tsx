import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-accent px-4">
      <div className="rounded-[32px] bg-white p-8 text-center shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-900">Page unavailable</h1>
        <p className="mt-2 text-sm text-slate-600">The page you requested could not be found.</p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white">Return home</Link>
      </div>
    </main>
  );
}
