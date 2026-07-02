import type { Metadata } from "next";
import "./globals.css";
import AuthProviderWrapper from "../src/app/AuthProviderWrapper";

export const metadata: Metadata = {
  title: "MediCare Clinic",
  description: "Production-ready medical scheduling experience",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full bg-[#FFF3D5] text-slate-900">
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}
