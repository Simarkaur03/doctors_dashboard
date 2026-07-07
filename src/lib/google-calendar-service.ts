import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

export async function getGoogleCalendarStatus(): Promise<{ connected: boolean; configured: boolean }> {
  const fn = httpsCallable<undefined, { connected: boolean; configured: boolean }>(functions, "getGoogleCalendarStatus");
  const result = await fn();
  return result.data;
}

export async function startGoogleCalendarConnect(): Promise<string> {
  const fn = httpsCallable<undefined, { authUrl: string }>(functions, "startGoogleCalendarConnect");
  const result = await fn();
  return result.data.authUrl;
}

export async function disconnectGoogleCalendar(): Promise<void> {
  const fn = httpsCallable(functions, "disconnectGoogleCalendar");
  await fn();
}
