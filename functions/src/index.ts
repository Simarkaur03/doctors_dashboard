import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

admin.initializeApp();

const db = admin.firestore();

export {
  startGoogleCalendarConnect,
  googleCalendarCallback,
  disconnectGoogleCalendar,
  getGoogleCalendarStatus,
} from "./google-calendar";
import { createCalendarEventForAppointment, deleteCalendarEventForAppointment } from "./google-calendar";

interface CancellationRequest {
  appointmentId: string;
  patientId: string;
  slotId: string;
  doctorId: string;
}

interface CancellationResponse {
  success: boolean;
  message: string;
  appointmentId: string;
  slotId: string;
}

interface AppointmentData {
  patientId: string;
  slotId: string;
  doctorId: string;
  status: string;
  cancelledAt?: string;
  cancelledBy?: string;
  [key: string]: unknown;
}

interface SlotData {
  doctorId: string;
  status: string;
  [key: string]: unknown;
}

interface BookingRequest {
  slotId: string;
  reason?: string;
}

interface BookingResponse {
  success: boolean;
  message: string;
  appointmentId: string;
  slotId: string;
}

export const bookAppointment = onCall<BookingRequest>(
  async (request): Promise<BookingResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in to book appointments");
    }
    if (!request.auth.token.email_verified) {
      throw new HttpsError("failed-precondition", "Please verify your email before booking appointments");
    }

    const patientId = request.auth.uid;
    const { slotId, reason } = request.data;

    if (!slotId) {
      throw new HttpsError("invalid-argument", "Missing required field: slotId");
    }

    const patientDoc = await db.collection("users").doc(patientId).get();
    const patientData = patientDoc.data();
    if (!patientData || patientData.role !== "patient") {
      throw new HttpsError("permission-denied", "Only patients can book appointments");
    }

    const calendarSync: {
      details: {
        appointmentId: string;
        doctorId: string;
        patientName: string;
        date: string;
        time: string;
        duration: number;
        reason?: string;
      } | null;
    } = { details: null };

    try {
      const result = await db.runTransaction(async (transaction) => {
        const slotRef = db.collection("slots").doc(slotId);
        const slotSnap = await transaction.get(slotRef);

        if (!slotSnap.exists) {
          throw new HttpsError("not-found", "This appointment slot no longer exists");
        }

        const slotData = slotSnap.data() as SlotData & {
          date: string;
          time: string;
          duration?: number;
          doctorName?: string;
        };

        if (slotData.status !== "available") {
          throw new HttpsError("failed-precondition", "This appointment slot is no longer available");
        }

        const slotDateTime = new Date(`${slotData.date}T${slotData.time}:00`);
        if (Number.isNaN(slotDateTime.getTime()) || slotDateTime.getTime() < Date.now()) {
          throw new HttpsError("failed-precondition", "You cannot book an appointment in the past");
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
          const eventId = await createCalendarEventForAppointment(details);
          if (eventId) {
            await db.collection("appointments").doc(details.appointmentId).update({ calendarEventId: eventId });
          }
        } catch (err) {
          console.error("Google Calendar sync failed for booking", err);
        }
      }

      return result as BookingResponse;
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error("bookAppointment failed", error);
      throw new HttpsError("internal", "An error occurred while booking the appointment");
    }
  }
);

export const cancelAppointment = onCall<CancellationRequest>(
  async (request): Promise<CancellationResponse> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in to cancel appointments");
    }

    const { appointmentId, patientId, slotId, doctorId } = request.data;

    if (request.auth.uid !== patientId) {
      throw new HttpsError("permission-denied", "You can only cancel your own appointments");
    }

    if (!appointmentId || !patientId || !slotId || !doctorId) {
      throw new HttpsError("invalid-argument", "Missing required fields: appointmentId, patientId, slotId, doctorId");
    }

    let cancelledCalendarEventId: string | null = null;

    try {
      const result = await db.runTransaction(async (transaction) => {
        const appointmentRef = db.collection("appointments").doc(appointmentId);
        const appointmentSnap = await transaction.get(appointmentRef);

        if (!appointmentSnap.exists) {
          throw new HttpsError("not-found", "Appointment not found");
        }

        const appointmentData = appointmentSnap.data() as AppointmentData & { calendarEventId?: string };
        cancelledCalendarEventId = appointmentData.calendarEventId || null;

        if (appointmentData.patientId !== patientId) {
          throw new HttpsError("permission-denied", "This appointment does not belong to you");
        }

        const cancellableStatuses = ["booked", "confirmed"];
        if (!cancellableStatuses.includes(appointmentData.status)) {
          throw new HttpsError("failed-precondition", `Cannot cancel appointment with status: ${appointmentData.status}`);
        }

        if (appointmentData.cancelledAt) {
          throw new HttpsError("failed-precondition", "This appointment has already been cancelled");
        }

        if (appointmentData.slotId !== slotId) {
          throw new HttpsError("failed-precondition", "Slot ID mismatch");
        }

        const slotRef = db.collection("slots").doc(slotId);
        const slotSnap = await transaction.get(slotRef);

        if (!slotSnap.exists) {
          throw new HttpsError("not-found", "Slot not found");
        }

        const slotData = slotSnap.data() as SlotData;

        if (slotData.doctorId !== doctorId) {
          throw new HttpsError("failed-precondition", "Slot does not belong to this doctor");
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
          appointmentId: FieldValue.delete(),
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
          await deleteCalendarEventForAppointment(doctorId, cancelledCalendarEventId);
        } catch (err) {
          console.error("Google Calendar sync failed for cancellation", err);
        }
      }

      return result as CancellationResponse;
    } catch (error: unknown) {
      if (error instanceof HttpsError) {
        throw error;
      }
      console.error("cancelAppointment failed", error);
      throw new HttpsError("internal", "An error occurred while cancelling the appointment");
    }
  }
);

export const verifyAppointmentStatus = onCall<{ appointmentId: string }>(
  async (request): Promise<{ canBeCancelled: boolean }> => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in");
    }

    const { appointmentId } = request.data;

    if (!appointmentId) {
      throw new HttpsError("invalid-argument", "appointmentId is required");
    }

    try {
      const appointmentSnap = await db.collection("appointments").doc(appointmentId).get();

      if (!appointmentSnap.exists) {
        return { canBeCancelled: false };
      }

      const appointmentData = appointmentSnap.data() as AppointmentData;

      if (appointmentData.patientId !== request.auth.uid) {
        return { canBeCancelled: false };
      }

      const cancellableStatuses = ["booked", "confirmed"];
      const canBeCancelled =
        cancellableStatuses.includes(appointmentData.status) && !appointmentData.cancelledAt;

      return { canBeCancelled };
    } catch {
      return { canBeCancelled: false };
    }
  }
);

export const cleanupOldCancelledAppointments = onCall(
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be logged in");
    }

    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const userData = userDoc.data();
    if (!userData || userData.role !== "admin") {
      throw new HttpsError("permission-denied", "Only administrators can perform cleanup operations");
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
    } catch {
      throw new HttpsError("internal", "Failed to clean up appointments");
    }
  }
);
