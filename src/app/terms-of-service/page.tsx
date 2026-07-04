import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
};

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-[#FFF3D5] px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)] md:p-12">
        <h1 className="text-3xl font-semibold text-[#24302A]">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-[#66736D]">
          Last updated: July 2, 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#3A4A40]">
          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              1. Acceptance of Terms
            </h2>
            <p className="mt-2">
              By accessing or using Doctor Dashboard, you agree to be bound by
              these Terms of Service. If you do not agree, do not use the
              service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              2. Description of Service
            </h2>
            <p className="mt-2">
              Doctor Dashboard is an appointment management platform that
              connects patients with healthcare providers. The service facilitates
              appointment booking, cancellation, and communication. It is not a
              medical service and does not provide medical advice or treatment.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              3. User Accounts
            </h2>
            <p className="mt-2">
              You must register an account and verify your email address to use
              the service. You are responsible for maintaining the confidentiality
              of your credentials and for all activities that occur under your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              4. Appointment Policies
            </h2>
            <p className="mt-2">
              Appointments may be cancelled through the platform. Cancellation
              policies are set by individual healthcare providers. The platform
              is not responsible for missed appointments or scheduling conflicts.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              5. Limitation of Liability
            </h2>
            <p className="mt-2">
              Doctor Dashboard is provided &quot;as is&quot; without warranties
              of any kind. We are not liable for any damages arising from the use
              or inability to use the service, including but not limited to
              missed appointments or service interruptions.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              6. Changes to Terms
            </h2>
            <p className="mt-2">
              We may update these terms at any time. Continued use of the service
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              7. Contact
            </h2>
            <p className="mt-2">
              For questions about these terms, contact us at{" "}
              <a
                href="mailto:legal@doctordashboard.com"
                className="text-[#4D694E] underline"
              >
                legal@doctordashboard.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-8 border-t border-[#DDE8E1] pt-6">
          <Link
            href="/"
            className="text-sm font-medium text-[#4D694E] hover:underline"
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
