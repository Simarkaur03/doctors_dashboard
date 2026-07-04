import { clsx } from "../../utils/clsx";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_-25px_rgba(77,105,78,0.2)]", className)}>{children}</div>;
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("mb-4", className)}>{children}</div>;
}
