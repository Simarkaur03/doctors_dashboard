import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function BackLink({ href, label = "Back" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      className="-ml-2 inline-flex items-center gap-2 rounded-xl px-2 py-1.5 text-sm font-semibold text-[#4D694E] transition duration-150 hover:bg-[#4D694E]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4D694E] focus-visible:ring-offset-2"
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Link>
  );
}
