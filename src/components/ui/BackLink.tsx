import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      // min-h-11 keeps this at a 44px touch target without widening the
      // hit area past the text, matching the nav rows in DashboardShell.
      className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-primary transition duration-150 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
