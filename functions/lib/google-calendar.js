"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleCalendarStatus = exports.disconnectGoogleCalendar = exports.googleCalendarCallback = exports.startGoogleCalendarConnect = void 0;
exports.createCalendarEventForAppointment = createCalendarEventForAppointment;
exports.deleteCalendarEventForAppointment = deleteCalendarEventForAppointment;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const googleapis_1 = require("googleapis");
const GOOGLE_CALENDAR_CLIENT_ID = (0, params_1.defineString)("GOOGLE_CALENDAR_CLIENT_ID", { default: "" });
const GOOGLE_CALENDAR_REDIRECT_URI = (0, params_1.defineString)("GOOGLE_CALENDAR_REDIRECT_URI", { default: "" });
const GOOGLE_CALENDAR_APP_URL = (0, params_1.defineString)("GOOGLE_CALENDAR_APP_URL", { default: "" });
const GOOGLE_CALENDAR_CLIENT_SECRET = (0, params_1.defineSecret)("GOOGLE_CALENDAR_CLIENT_SECRET");
function getDb() {
    return admin.firestore();
}
function getOAuthClient() {
    return new googleapis_1.google.auth.OAuth2(GOOGLE_CALENDAR_CLIENT_ID.value(), GOOGLE_CALENDAR_CLIENT_SECRET.value(), GOOGLE_CALENDAR_REDIRECT_URI.value());
}
function isConfigured() {
    return Boolean(GOOGLE_CALENDAR_CLIENT_ID.value() &&
        GOOGLE_CALENDAR_REDIRECT_URI.value() &&
        GOOGLE_CALENDAR_CLIENT_SECRET.value());
}
async function assertDoctor(uid) {
    const userDoc = await getDb().collection("users").doc(uid).get();
    const role = userDoc.data()?.role;
    if (role !== "doctor" && role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only doctors can manage Google Calendar settings");
    }
}
exports.startGoogleCalendarConnect = (0, https_1.onCall)({ secrets: [GOOGLE_CALENDAR_CLIENT_SECRET] }, async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in");
    }
    if (!isConfigured()) {
        throw new https_1.HttpsError("failed-precondition", "Google Calendar is not configured for this project yet. An administrator needs to set up OAuth credentials first.");
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
});
exports.googleCalendarCallback = (0, https_1.onRequest)({ secrets: [GOOGLE_CALENDAR_CLIENT_SECRET] }, async (req, res) => {
    const appUrl = GOOGLE_CALENDAR_APP_URL.value() || "/";
    const code = req.query.code;
    const state = req.query.state;
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
    const { doctorId } = stateSnap.data();
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
    }
    catch {
        res.redirect(`${appUrl}/doctor/availability?calendar=error`);
    }
});
exports.disconnectGoogleCalendar = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in");
    }
    await assertDoctor(request.auth.uid);
    await getDb().collection("calendarSettings").doc(request.auth.uid).delete();
    return { success: true };
});
exports.getGoogleCalendarStatus = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "You must be logged in");
    }
    await assertDoctor(request.auth.uid);
    const snap = await getDb().collection("calendarSettings").doc(request.auth.uid).get();
    return { connected: snap.exists, configured: isConfigured() };
});
/**
 * Best-effort calendar sync helpers. Callers must swallow errors so a Calendar
 * outage or missing connection never blocks booking/cancellation.
 */
async function createCalendarEventForAppointment(params) {
    const settingsSnap = await getDb().collection("calendarSettings").doc(params.doctorId).get();
    if (!settingsSnap.exists)
        return null;
    const settings = settingsSnap.data();
    if (!settings.refreshToken)
        return null;
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: settings.refreshToken });
    const calendar = googleapis_1.google.calendar({ version: "v3", auth: oauth2Client });
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
async function deleteCalendarEventForAppointment(doctorId, eventId) {
    const settingsSnap = await getDb().collection("calendarSettings").doc(doctorId).get();
    if (!settingsSnap.exists)
        return;
    const settings = settingsSnap.data();
    if (!settings.refreshToken)
        return;
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials({ refresh_token: settings.refreshToken });
    const calendar = googleapis_1.google.calendar({ version: "v3", auth: oauth2Client });
    await calendar.events.delete({ calendarId: "primary", eventId });
}
//# sourceMappingURL=google-calendar.js.map