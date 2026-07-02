import { clsx } from "../../utils/clsx";

export function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return <span className={clsx("inline-flex items-center rounded-full bg-[#FFF3D5] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#4D694E]", className)}>{children}</span>;
}
