import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: process.env.NODE_ENV === "production" ? 1.0 : 0,
    beforeSend(event) {
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      return event;
    },
    ignoreErrors: [
      "ResizeObserver loop",
      "Non-Error promise rejection captured",
    ],
  });

  if (typeof window !== "undefined") {
    window.__SENTRY_INITIALIZED__ = true;
  }
}
