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
export declare const startGoogleCalendarConnect: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    authUrl: string;
}>, unknown>;
export declare const googleCalendarCallback: import("firebase-functions/v2/https").HttpsFunction;
export declare const disconnectGoogleCalendar: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    success: boolean;
}>, unknown>;
export declare const getGoogleCalendarStatus: import("firebase-functions/v2/https").CallableFunction<any, Promise<{
    connected: boolean;
    configured: boolean;
}>, unknown>;
/**
 * Best-effort calendar sync helpers. Callers must swallow errors so a Calendar
 * outage or missing connection never blocks booking/cancellation.
 */
export declare function createCalendarEventForAppointment(params: {
    doctorId: string;
    patientName: string;
    date: string;
    time: string;
    duration: number;
    reason?: string;
}): Promise<string | null>;
export declare function deleteCalendarEventForAppointment(doctorId: string, eventId: string): Promise<void>;
//# sourceMappingURL=google-calendar.d.ts.map