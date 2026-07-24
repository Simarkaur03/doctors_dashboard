import { clsx } from "../../utils/clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center rounded-2xl font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100 active:scale-[0.98]";
  const variants = {
    primary: "bg-primary text-white shadow-sm hover:bg-primary-hover hover:shadow-md focus-visible:ring-primary",
    secondary: "bg-accent text-primary hover:bg-accent-hover hover:shadow-sm focus-visible:ring-primary",
    ghost: "bg-transparent text-primary hover:bg-slate-100 focus-visible:ring-primary",
  };
  const sizes = {
    sm: "h-10 px-3 text-sm",
    md: "h-12 px-4 text-sm",
    lg: "h-14 px-6 text-base",
  };

  return <button className={clsx(base, variants[variant], sizes[size], className)} {...props} />;
}
