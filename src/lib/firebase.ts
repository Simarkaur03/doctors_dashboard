import { initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";
import { env } from "./env";

const app = initializeApp(env.firebase);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);

declare global {
  var __firebaseEmulatorsConnected: boolean | undefined;
}

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true" && !globalThis.__firebaseEmulatorsConnected) {
  globalThis.__firebaseEmulatorsConnected = true;
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
