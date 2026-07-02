type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  event: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "apiKey",
  "ssn",
  "medicalRecord",
  "diagnosis",
  "prescription",
  "healthData",
]);

function sanitize(data: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (REDACTED_KEYS.has(key)) {
      clean[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      clean[key] = sanitize(value as Record<string, unknown>);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

function createEntry(level: LogLevel, event: string, data?: Record<string, unknown>): LogEntry {
  return {
    level,
    event,
    data: data ? sanitize(data) : undefined,
    timestamp: new Date().toISOString(),
  };
}

function send(entry: LogEntry) {
  if (process.env.NODE_ENV === "production") {
    if (typeof window !== "undefined" && window.__SENTRY_INITIALIZED__) {
      import("@sentry/nextjs").then((Sentry) => {
        Sentry.addBreadcrumb({
          category: entry.event,
          level: entry.level === "error" ? "error" : entry.level === "warn" ? "warning" : "info",
          data: entry.data,
          timestamp: Date.now() / 1000,
        });
      });
    }
  }
}

export const logger = {
  info(event: string, data?: Record<string, unknown>) {
    send(createEntry("info", event, data));
  },
  warn(event: string, data?: Record<string, unknown>) {
    send(createEntry("warn", event, data));
  },
  error(event: string, data?: Record<string, unknown>) {
    send(createEntry("error", event, data));
  },
};

declare global {
  interface Window {
    __SENTRY_INITIALIZED__?: boolean;
  }
}
