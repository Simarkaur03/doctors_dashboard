import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FFF3D5] px-4 py-12">
      <div className="mx-auto max-w-3xl rounded-[32px] bg-white p-8 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)] md:p-12">
        <h1 className="text-3xl font-semibold text-[#24302A]">Privacy Policy</h1>
        <p className="mt-2 text-sm text-[#66736D]">
          Last updated: July 2, 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#3A4A40]">
          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              1. Information We Collect
            </h2>
            <p className="mt-2">
              We collect information you provide when creating an account, booking
              appointments, and using our services. This includes your name, email
              address, and appointment details. We do not collect or store medical
              records, diagnoses, or prescriptions through this platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              2. How We Use Your Information
            </h2>
            <p className="mt-2">
              Your information is used to provide and improve our appointment
              management services, send appointment confirmations and reminders,
              and communicate important service updates.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              3. Data Storage & Security
            </h2>
            <p className="mt-2">
              Your data is stored securely using Firebase (Google Cloud Platform)
              with encryption at rest and in transit. Access to your data is
              protected by role-based access controls and email verification
              requirements.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              4. Data Sharing
            </h2>
            <p className="mt-2">
              We do not sell or share your personal information with third parties.
              Your appointment data is only accessible to you and your assigned
              healthcare provider.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              5. Your Rights
            </h2>
            <p className="mt-2">
              You have the right to access, update, or request deletion of your
              personal data. To exercise these rights, contact your healthcare
              provider or email us at the address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#24302A]">
              6. Contact
            </h2>
            <p className="mt-2">
              For privacy-related inquiries, contact us at{" "}
              <a
                href="mailto:privacy@doctordashboard.com"
                className="text-[#4D694E] underline"
              >
                privacy@doctordashboard.com
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
