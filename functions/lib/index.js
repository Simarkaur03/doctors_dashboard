"use strict";
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
exports.cleanupOldCancelledAppointments = exports.verifyAppointmentStatus = exports.cancelAppointment = exports.bookAppointment = exports.getGoogleCalendarStatus = exports.disconnectGoogleCalendar = exports.googleCalendarCallback = exports.startGoogleCalendarConnect = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-admin/firestore");
admin.initializeApp();
const db = admin.firestore();
var google_calendar_1 = require("./google-calendar");
Object.defineProperty(exports, "startGoogleCalendarConnect", { enumerable: true, get: function () { return google_calendar_1.startGoogleCalendarConnect; } });
Object.defineProperty(exports, "googleCalendarCallback", { enumerable: true, get: function () { return google_calendar_1.googleCalendarCallback; } });
Object.defineProperty(exports, "disconnectGoogleCalendar", { enumerable: true, get: function () { return google_calendar_1.disconnectGoogleCalendar; } });
Object.defineProperty(exports, "getGoogleCalendarStatus", { enumerable: true, get: function () { return google_calendar_1.getGoogleCalendarStatus; } });
const google_calendar_2 = require("./google-calendar");
exports.bookAppointment = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in to book appointments");
    }
    const patientId = request.auth.uid;
    const { slotId, reason } = request.data;
    if (!slotId) {
        throw new https_1.HttpsError("invalid-argument", "Missing required field: slotId");
    }
    const patientDoc = await db.collection("users").doc(patientId).get();
    const patientData = patientDoc.data();
    if (!patientData || patientData.role !== "patient") {
        throw new https_1.HttpsError("permission-denied", "Only patients can book appointments");
    }
    const calendarSync = { details: null };
    try {
        const result = await db.runTransaction(async (transaction) => {
            const slotRef = db.collection("slots").doc(slotId);
            const slotSnap = await transaction.get(slotRef);
            if (!slotSnap.exists) {
                throw new https_1.HttpsError("not-found", "This appointment slot no longer exists");
            }
            const slotData = slotSnap.data();
            if (slotData.status !== "available") {
                throw new https_1.HttpsError("failed-precondition", "This appointment slot is no longer available");
            }
            const slotDateTime = new Date(`${slotData.date}T${slotData.time}:00`);
            if (Number.isNaN(slotDateTime.getTime()) || slotDateTime.getTime() < Date.now()) {
                throw new https_1.HttpsError("failed-precondition", "You cannot book an appointment in the past");
            }
            const appointmentRef = db.collection("appointments").doc();
            const now = new Date().toISOString();
            const duration = slotData.duration || 30;
            transaction.set(appointmentRef, {
                patientId,
                patientName: patientData.name || "Patient",
                doctorId: slotData.doctorId,
                doctorName: slotData.doctorName || "Doctor",
                slotId,
                date: slotData.date,
                time: slotData.time,
                duration,
                status: "booked",
                reason: reason || "",
                bookedAt: now,
                createdAt: now,
                updatedAt: now,
            });
            transaction.update(slotRef, {
                status: "booked",
                appointmentId: appointmentRef.id,
                updatedAt: now,
            });
            const auditLogRef = db.collection("auditLogs").doc();
            transaction.set(auditLogRef, {
                action: "appointment_booked",
                appointmentId: appointmentRef.id,
                patientId,
                slotId,
                doctorId: slotData.doctorId,
                performedBy: "patient",
                timestamp: now,
                createdAt: now,
            });
            calendarSync.details = {
                appointmentId: appointmentRef.id,
                doctorId: slotData.doctorId,
                patientName: patientData.name || "Patient",
                date: slotData.date,
                time: slotData.time,
                duration,
                reason,
            };
            return {
                success: true,
                message: "Appointment booked successfully",
                appointmentId: appointmentRef.id,
                slotId,
            };
        });
        if (calendarSync.details) {
            const details = calendarSync.details;
            try {
                const eventId = await (0, google_calendar_2.createCalendarEventForAppointment)(details);
                if (eventId) {
                    await db.collection("appointments").doc(details.appointmentId).update({ calendarEventId: eventId });
                }
            }
            catch (err) {
                console.error("Google Calendar sync failed for booking", err);
            }
        }
        return result;
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        console.error("bookAppointment failed", error);
        throw new https_1.HttpsError("internal", "An error occurred while booking the appointment");
    }
});
exports.cancelAppointment = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in to cancel appointments");
    }
    const { appointmentId, patientId, slotId, doctorId } = request.data;
    if (request.auth.uid !== patientId) {
        throw new https_1.HttpsError("permission-denied", "You can only cancel your own appointments");
    }
    if (!appointmentId || !patientId || !slotId || !doctorId) {
        throw new https_1.HttpsError("invalid-argument", "Missing required fields: appointmentId, patientId, slotId, doctorId");
    }
    let cancelledCalendarEventId = null;
    try {
        const result = await db.runTransaction(async (transaction) => {
            const appointmentRef = db.collection("appointments").doc(appointmentId);
            const appointmentSnap = await transaction.get(appointmentRef);
            if (!appointmentSnap.exists) {
                throw new https_1.HttpsError("not-found", "Appointment not found");
            }
            const appointmentData = appointmentSnap.data();
            cancelledCalendarEventId = appointmentData.calendarEventId || null;
            if (appointmentData.patientId !== patientId) {
                throw new https_1.HttpsError("permission-denied", "This appointment does not belong to you");
            }
            const cancellableStatuses = ["booked", "confirmed"];
            if (!cancellableStatuses.includes(appointmentData.status)) {
                throw new https_1.HttpsError("failed-precondition", `Cannot cancel appointment with status: ${appointmentData.status}`);
            }
            if (appointmentData.cancelledAt) {
                throw new https_1.HttpsError("failed-precondition", "This appointment has already been cancelled");
            }
            if (appointmentData.slotId !== slotId) {
                throw new https_1.HttpsError("failed-precondition", "Slot ID mismatch");
            }
            const slotRef = db.collection("slots").doc(slotId);
            const slotSnap = await transaction.get(slotRef);
            if (!slotSnap.exists) {
                throw new https_1.HttpsError("not-found", "Slot not found");
            }
            const slotData = slotSnap.data();
            if (slotData.doctorId !== doctorId) {
                throw new https_1.HttpsError("failed-precondition", "Slot does not belong to this doctor");
            }
            const now = new Date().toISOString();
            transaction.update(appointmentRef, {
                status: "cancelled",
                cancelledBy: "patient",
                cancelledAt: now,
                updatedAt: now,
            });
            transaction.update(slotRef, {
                status: "available",
                appointmentId: firestore_1.FieldValue.delete(),
                updatedAt: now,
            });
            const auditLogRef = db.collection("auditLogs").doc();
            transaction.set(auditLogRef, {
                action: "appointment_cancelled",
                appointmentId,
                patientId,
                slotId,
                doctorId,
                performedBy: "patient",
                timestamp: now,
                createdAt: now,
            });
            return {
                success: true,
                message: "Appointment cancelled successfully",
                appointmentId,
                slotId,
            };
        });
        if (cancelledCalendarEventId) {
            try {
                await (0, google_calendar_2.deleteCalendarEventForAppointment)(doctorId, cancelledCalendarEventId);
            }
            catch (err) {
                console.error("Google Calendar sync failed for cancellation", err);
            }
        }
        return result;
    }
    catch (error) {
        if (error instanceof https_1.HttpsError) {
            throw error;
        }
        console.error("cancelAppointment failed", error);
        throw new https_1.HttpsError("internal", "An error occurred while cancelling the appointment");
    }
});
exports.verifyAppointmentStatus = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in");
    }
    const { appointmentId } = request.data;
    if (!appointmentId) {
        throw new https_1.HttpsError("invalid-argument", "appointmentId is required");
    }
    try {
        const appointmentSnap = await db.collection("appointments").doc(appointmentId).get();
        if (!appointmentSnap.exists) {
            return { canBeCancelled: false };
        }
        const appointmentData = appointmentSnap.data();
        if (appointmentData.patientId !== request.auth.uid) {
            return { canBeCancelled: false };
        }
        const cancellableStatuses = ["booked", "confirmed"];
        const canBeCancelled = cancellableStatuses.includes(appointmentData.status) && !appointmentData.cancelledAt;
        return { canBeCancelled };
    }
    catch {
        return { canBeCancelled: false };
    }
});
exports.cleanupOldCancelledAppointments = (0, https_1.onCall)(async (request) => {
    if (!request.auth) {
        throw new https_1.HttpsError("unauthenticated", "User must be logged in");
    }
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== "admin") {
        throw new https_1.HttpsError("permission-denied", "Only administrators can perform cleanup operations");
    }
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    try {
        const snapshot = await db
            .collection("appointments")
            .where("status", "==", "cancelled")
            .where("cancelledAt", "<", ninetyDaysAgo.toISOString())
            .get();
        let deletedCount = 0;
        const batch = db.batch();
        snapshot.docs.forEach((doc) => {
            batch.delete(doc.ref);
            deletedCount++;
            if (deletedCount % 500 === 0) {
                batch.commit();
            }
        });
        if (deletedCount % 500 !== 0) {
            await batch.commit();
        }
        return {
            success: true,
            message: `Cleaned up ${deletedCount} cancelled appointments`,
        };
    }
    catch {
        throw new https_1.HttpsError("internal", "Failed to clean up appointments");
    }
});
//# sourceMappingURL=index.js.map