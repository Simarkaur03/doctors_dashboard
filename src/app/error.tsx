"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-accent px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-md">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
          Unexpected issue
        </p>
        <h1 className="mt-3 text-2xl font-semibold text-slate-900">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          We could not load this screen. Please try again.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
