import type { Metadata } from "next";
import { BackLink } from "../../components/ui/BackLink";
import { Card } from "../../components/ui/Card";
import { PageContainer } from "../../components/ui/PageContainer";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPolicyPage() {
  return (
    <PageContainer width="narrow">
      <BackLink href="/" label="Back to home" />
      <Card className="p-6 md:p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: July 2, 2026
        </p>

        <div className="mt-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <section>
            <h2 className="text-lg font-semibold text-slate-900">
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
            <h2 className="text-lg font-semibold text-slate-900">
              2. How We Use Your Information
            </h2>
            <p className="mt-2">
              Your information is used to provide and improve our appointment
              management services, send appointment confirmations and reminders,
              and communicate important service updates.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
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
            <h2 className="text-lg font-semibold text-slate-900">
              4. Data Sharing
            </h2>
            <p className="mt-2">
              We do not sell or share your personal information with third parties.
              Your appointment data is only accessible to you and your assigned
              healthcare provider.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              5. Your Rights
            </h2>
            <p className="mt-2">
              You have the right to access, update, or request deletion of your
              personal data. To exercise these rights, contact your healthcare
              provider or email us at the address below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-slate-900">
              6. Contact
            </h2>
            <p className="mt-2">
              For privacy-related inquiries, contact us at{" "}
              <a
                href="mailto:privacy@doctordashboard.com"
                className="text-primary underline"
              >
                privacy@doctordashboard.com
              </a>
              .
            </p>
          </section>
        </div>
      </Card>
    </PageContainer>
  );
}
