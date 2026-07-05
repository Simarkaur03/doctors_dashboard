if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
  throw new Error("NEXT_PUBLIC_FIREBASE_API_KEY missing");
}

if (!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
  throw new Error("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN missing");
}

// ...repeat for the remaining variables