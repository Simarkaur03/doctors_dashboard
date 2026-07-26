import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

// The Firebase Auth/Firestore JS SDKs talk to these hosts directly via
// fetch/WebSocket when NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true (see
// src/lib/firebase.ts) — without them in connect-src, the CSP silently
// blocks every emulator request ("Failed to fetch") in a real browser.
// This flag must never be set in production, so this never loosens the
// deployed CSP.
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
const emulatorConnectSrc = useEmulators ? "http://127.0.0.1:9099 http://127.0.0.1:8080 ws://127.0.0.1:8080" : "";

const isDev = process.env.NODE_ENV !== "production";

// Google's sign-in stack, split by the role each host actually plays so the
// allowances stay auditable:
//  - apis.google.com      serves js/api.js, the gapi loader that firebase-js-sdk
//                         injects into *our* page to broker signInWithPopup /
//                         signInWithRedirect. This is the script CSP was blocking.
//  - accounts.google.com  Google Identity Services client + the OAuth consent UI.
//  - www.gstatic.com      static assets Firebase Auth / GIS pull in (reCAPTCHA, icons).
const GOOGLE_SCRIPT_SRC = "https://apis.google.com https://accounts.google.com https://www.gstatic.com";
// The auth handler iframe lives on the Firebase authDomain (*.firebaseapp.com);
// apis.google.com and accounts.google.com host the relay + consent frames.
const GOOGLE_FRAME_SRC = "https://*.firebaseapp.com https://accounts.google.com https://apis.google.com";
// identitytoolkit / securetoken / firestore are all *.googleapis.com.
const GOOGLE_CONNECT_SRC =
  "https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebaseapp.com https://accounts.google.com https://apis.google.com";
// Google account avatars come from lh*.googleusercontent.com.
const GOOGLE_IMG_SRC = "https://*.googleapis.com https://*.googleusercontent.com https://www.gstatic.com";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // 'unsafe-eval' is only required by the dev bundler (React Refresh /
      // eval source maps); the production bundle does not eval, so it is
      // dropped there. Firebase/Google/Sentry never need it.
      `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${GOOGLE_SCRIPT_SRC}`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      `img-src 'self' data: blob: ${GOOGLE_IMG_SRC}`,
      `connect-src 'self' ${GOOGLE_CONNECT_SRC} https://*.sentry.io ${emulatorConnectSrc}`.trim(),
      `frame-src 'self' ${GOOGLE_FRAME_SRC}`,
      // Sentry Session Replay compresses payloads in a blob-backed Worker.
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      // Modern equivalent of the X-Frame-Options: DENY header above.
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["firebase-admin"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.googleapis.com" }],
  },
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default withSentryConfig(nextConfig, {
  org: "blyu",
  project: "blyu-doc-dashboard",
  silent: !process.env.CI,
  widenClientFileUpload: true,
  webpack: {
    automaticVercelMonitors: true,
    treeshake: { removeDebugLogging: true },
  },
});
