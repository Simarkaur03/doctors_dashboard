import { clsx } from "../../utils/clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-2xl font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary: "bg-[#4D694E] text-white hover:bg-[#415b41] focus-visible:ring-[#4D694E]",
    secondary: "bg-[#FFF3D5] text-[#4D694E] hover:bg-[#f8e8bc] focus-visible:ring-[#4D694E]",
    ghost: "bg-transparent text-[#4D694E] hover:bg-[#f4f5f3] focus-visible:ring-[#4D694E]",
  };
  const sizes = {
    sm: "h-10 px-3 text-sm",
    md: "h-12 px-4 text-sm",
    lg: "h-14 px-6 text-base",
  };

  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
