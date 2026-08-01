import Link from "next/link";

export default function ForbiddenPage() {
  return (
    // Same centred-card frame as the login / landing pages, so every
    // full-page message in the app shares one surface.
    <main className="flex min-h-screen items-center justify-center bg-accent px-4">
      <section className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">403</p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">Access restricted</h1>
        <p className="mt-2 text-sm text-slate-600">You do not have permission to view this area.</p>
        <Link href="/" className="mt-6 inline-flex rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white">Return home</Link>
      </section>
    </main>
  );
}
