"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#FFF3D5",
            padding: "1rem",
          }}
        >
          <div
            style={{
              borderRadius: "32px",
              backgroundColor: "white",
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 20px 60px -25px rgba(77,105,78,0.2)",
            }}
          >
            <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#0f172a" }}>
              Something went wrong
            </h1>
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#475569" }}>
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={reset}
              style={{
                marginTop: "1.5rem",
                borderRadius: "1rem",
                backgroundColor: "#4D694E",
                padding: "0.75rem 1rem",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "white",
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
