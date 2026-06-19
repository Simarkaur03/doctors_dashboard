// Public landing page (no auth). Serves as the app entry at `/`.
import Link from "next/link";

export const metadata = {
  title: "MediCare Clinic - Welcome",
};

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-sage-light flex items-center justify-center">
      <section className="mx-6 w-full max-w-md bg-white rounded-2xl p-8 shadow-md border border-gray-200">
        <header className="flex flex-col items-center text-center gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-sage text-white" aria-hidden>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold text-sage">MediCare Clinic</h1>
          </div>

          <p className="text-base text-[#6B7280]">Compassionate care. Simple scheduling.</p>
        </header>

        <div className="mt-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900">Book Your Appointment</h2>
        </div>

        <div className="mt-6 space-y-3">
          <Link
            href="/patient/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-sage px-4 py-3 text-base font-medium text-white shadow-sm hover:bg-sage-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-dark"
            aria-label="Patient login — proceed to patient sign in"
          >
            Patient Login
          </Link>

          <Link
            href="/admin/login"
            className="inline-flex w-full items-center justify-center rounded-lg bg-white px-4 py-3 text-base font-medium text-sage border border-sage shadow-sm hover:bg-sage-light focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sage-dark"
            aria-label="Admin login — proceed to admin sign in"
          >
            Admin Login
          </Link>
        </div>
      </section>
    </main>
  );
}
