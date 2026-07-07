if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY missing");
}

if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
  throw new Error("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN missing");
}

if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
  throw new Error("NEXT_PUBLIC_FIREBASE_PROJECT_ID missing");
}

if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID) {
  throw new Error("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID missing");
}

if (!process.env.NEXT_PUBLIC_FIREBASE_APP_ID) {
  throw new Error("NEXT_PUBLIC_FIREBASE_APP_ID missing");
}

export const env = {
  firebase: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  },
};