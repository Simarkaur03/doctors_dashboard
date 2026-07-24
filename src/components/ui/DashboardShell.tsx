"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { Logo } from "./Logo";

export type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

/**
 * Shared, mobile-first app chrome used by every dashboard (patient, doctor,
 * admin) so navigation, spacing and colors are identical across roles.
 *
 * - md and up: persistent sidebar.
 * - below md: sticky top bar with a hamburger that opens a slide-in drawer.
 *
 * The content column is a plain `min-w-0` div (not a <main>) so each page keeps
 * ownership of the single <main> landmark, and long content can never force the
 * flex row wider than the viewport.
 */
export function DashboardShell({
  navItems,
  onSignOut,
  children,
}: {
  navItems: NavItem[];
  onSignOut: () => void;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // Every drawer nav link and the sign-out button already close the drawer on
  // click, so there is no separate route-change effect to keep them in sync.

  // Lock body scroll and wire up Escape-to-close while the drawer is open.
  useEffect(() => {
    if (!drawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  const navLinks = (variant: "sidebar" | "drawer") =>
    navItems.map((item) => {
      const Icon = item.icon;
      const active = isActive(item.href);
      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={variant === "drawer" ? () => setDrawerOpen(false) : undefined}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
            active
              ? "bg-primary text-white shadow-sm"
              : "text-slate-700 hover:bg-primary/10"
          }`}
        >
          <Icon className="h-5 w-5 shrink-0" />
          <span>{item.label}</span>
        </Link>
      );
    });

  const signOutButton = (
    <button
      onClick={onSignOut}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition duration-150 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
    >
      <LogOut className="h-5 w-5 shrink-0" />
      <span>Sign out</span>
    </button>
  );

  return (
    <div className="min-h-screen md:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-slate-200 bg-white px-4 py-6 md:flex">
        <div>
          <Link href={navItems[0]?.href ?? "/"} className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
            <Logo />
          </Link>
          <nav className="mt-8 space-y-1">{navLinks("sidebar")}</nav>
        </div>
        {signOutButton}
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
        <Link href={navItems[0]?.href ?? "/"} className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
          <Logo />
        </Link>
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          aria-expanded={drawerOpen}
          aria-controls="mobile-nav-drawer"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 transition duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {/* Mobile drawer + backdrop */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-nav-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col justify-between bg-white px-4 py-5 shadow-xl"
          >
            <div>
              <div className="flex items-center justify-between">
                <Logo />
                <button
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition duration-150 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="mt-8 space-y-1">{navLinks("drawer")}</nav>
            </div>
            <div onClick={() => setDrawerOpen(false)}>{signOutButton}</div>
          </div>
        </div>
      ) : null}

      {/* Content column — pages own their <main> landmark */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
