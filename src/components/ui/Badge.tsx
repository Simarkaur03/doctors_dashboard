import { clsx } from "../../utils/clsx";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={clsx("inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary", className)}>{children}</span>;
}
