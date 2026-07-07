/**
 * Google Calendar integration.
 *
 * Requires external setup that only the project owner can perform (cannot be
 * automated from here):
 *   1. In the Google Cloud project backing this Firebase project, enable the
 *      "Google Calendar API".
 *   2. Create an OAuth 2.0 Client ID (Web application). Add the deployed
 *      googleCalendarCallback function URL as an authorized redirect URI,
 *      e.g. https://<region>-<project-id>.cloudfunctions.net/googleCalendarCallback
 *   3. In functions/.env (or functions/.env.<project-id> for a specific
 *      deploy target), set:
 *        GOOGLE_CALENDAR_CLIENT_ID=...
 *        GOOGLE_CALENDAR_REDIRECT_URI=https://<region>-<project-id>.cloudfunctions.net/googleCalendarCallback
 *        GOOGLE_CALENDAR_APP_URL=https://your-app.example.com
 *   4. Set the secret (prompts for the value):
 *        firebase functions:secrets:set GOOGLE_CALENDAR_CLIENT_SECRET
 *
 * No frontend configuration is required — the "Connect Google Calendar"
 * button and its callback are driven entirely by these Cloud Functions.
 * Until the above is done, getGoogleCalendarStatus reports
 * `configured: false` and the connect button stays hidden.
 */

import { onCall, onRequest, HttpsError } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { google } from "googleapis";

const GOOGLE_CALENDAR_CLIENT_ID = defineString("GOOGLE_CALENDAR_CLIENT_ID", { default: "" });
const GOOGLE_CALENDAR_REDIRECT_URI = defineString("GOOGLE_CALENDAR_REDIRECT_URI", { default: "" });
const GOOGLE_CALENDAR_APP_URL = defineString("GOOGLE_CALENDAR_APP_URL", { default: "" });
const GOOGLE_CALENDAR_CLIENT_SECRET = defineSecret("GOOGLE_CALENDAR_CLIENT_SECRET");

function getDb() {
  return admin.firestore();
}

function getOAuthClient() {
  return new google.auth.OAuth2(
    GOOGLE_CALENDAR_CLIENT_ID.value(),
    GOOGLE_CALENDAR_CLIENT_SECRET.value(),
    GOOGLE_CALENDAR_REDIRECT_URI.value()
  );
}

function isConfigured(): boolean {
  return Boolean(
    GOOGLE_CALENDAR_CLIENT_ID.value() &&
      GOOGLE_CALENDAR_REDIRECT_URI.value() &&
      GOOGLE_CALENDAR_CLIENT_SECRET.value()
  );
}

async function assertDoctor(uid: string) {
  const userDoc = await getDb().collection("users").doc(uid).get();
  const role = userDoc.data()?.role;
  if (role !== "doctor" && role !== "admin") {
    throw new HttpsError("permission-denied", "Only doctors can manage Google Calendar settings");
  }
}

export const startGoogleCalendarConnect = onCall(
  { secrets: [GOOGLE_CALENDAR_CLIENT_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "You must be logged in");
    }
    if (!isConfigured()) {
      throw new HttpsError(
        "failed-precondition",
        "Google Calendar is not configured for this project yet. An administrator needs to set up OAuth credentials first."
      );
    }
    await assertDoctor(request.auth.uid);

    const state = getDb().collection("oauthStates").doc().id;
    await getDb().collection("oauthStates").doc(state).set({
      doctorId: request.auth.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const oauth2Client = getOAuthClient();
    const authUrl = oauth2Client.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: ["https://www.googleapis.com/auth/calendar.events"],
      state,
    });

    return { authUrl };
  }
);

export const googleCalendarCallback = onRequest(
  { secrets: [GOOGLE_CALENDAR_CLIENT_SECRET] },
  async (req, res) => {
    const appUrl = GOOGLE_CALENDAR_APP_URL.value() || "/";
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;

    if (!code || !state) {
      res.redirect(`${appUrl}/doctor/availability?calendar=error`);
      return;
    }

    const stateRef = getDb().collection("oauthStates").doc(state);
    const stateSnap = await stateRef.get();
    if (!stateSnap.exists) {
      res.redirect(`${appUrl}/doctor/availability?calendar=error`);
      return;
    }
    const { doctorId } = stateSnap.data() as { doctorId: string };
    await stateRef.delete();

    try {
      const oauth2Client = getOAuthClient();
      const { tokens } = await oauth2Client.getToken(code);

      await getDb()
        .collection("calendarSettings")
        .doc(doctorId)
        .set({
          doctorId,
          refreshToken: tokens.refresh_token || null,
          accessToken: tokens.access_token || null,
          expiryDate: tokens.expiry_date || null,
          connectedAt: new Date().toISOString(),
        });

      res.redirect(`${appUrl}/doctor/availability?calendar=connected`);
    } catch {
      res.redirect(`${appUrl}/doctor/availability?calendar=error`);
    }
  }
);

export const disconnectGoogleCalendar = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in");
  }
  await assertDoctor(request.auth.uid);
  await getDb().collection("calendarSettings").doc(request.auth.uid).delete();
  return { success: true };
});

export const getGoogleCalendarStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in");
  }
  await assertDoctor(request.auth.uid);
  const snap = await getDb().collection("calendarSettings").doc(request.auth.uid).get();
  return { connected: snap.exists, configured: isConfigured() };
});

/**
 * Best-effort calendar sync helpers. Callers must swallow errors so a Calendar
 * outage or missing connection never blocks booking/cancellation.
 */
export async function createCalendarEventForAppointment(params: {
  doctorId: string;
  patientName: string;
  date: string;
  time: string;
  duration: number;
  reason?: string;
}): Promise<string | null> {
  const settingsSnap = await getDb().collection("calendarSettings").doc(params.doctorId).get();
  if (!settingsSnap.exists) return null;
  const settings = settingsSnap.data() as { refreshToken?: string };
  if (!settings.refreshToken) return null;

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: settings.refreshToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const start = new Date(`${params.date}T${params.time}:00`);
  const end = new Date(start.getTime() + params.duration * 60000);

  const event = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: `Appointment with ${params.patientName}`,
      description: params.reason || undefined,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
    },
  });

  return event.data.id || null;
}

export async function deleteCalendarEventForAppointment(doctorId: string, eventId: string): Promise<void> {
  const settingsSnap = await getDb().collection("calendarSettings").doc(doctorId).get();
  if (!settingsSnap.exists) return;
  const settings = settingsSnap.data() as { refreshToken?: string };
  if (!settings.refreshToken) return;

  const oauth2Client = getOAuthClient();
  oauth2Client.setCredentials({ refresh_token: settings.refreshToken });
  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  await calendar.events.delete({ calendarId: "primary", eventId });
}
