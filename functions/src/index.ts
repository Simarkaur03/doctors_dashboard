/**
 * Firebase Cloud Functions for Doctor Appointment Dashboard
 * Handles transactional appointment cancellations, verification, and audit logging
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// ============================================================
// TYPES
// ============================================================

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
  [key: string]: any;
}

interface SlotData {
  doctorId: string;
  status: string;
  [key: string]: any;
}

// ============================================================
// CANCELLATION FUNCTION
// ============================================================

/**
 * Cancel an appointment with Firestore transaction
 * Ensures appointment and slot are updated atomically
 */
export const cancelAppointment = functions.https.onCall(
  async (data: CancellationRequest, context): Promise<CancellationResponse> => {
    // Verify user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be logged in to cancel appointments"
      );
    }

    const { appointmentId, patientId, slotId, doctorId } = data;

    // Verify user is the patient
    if (context.auth.uid !== patientId) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You can only cancel your own appointments"
      );
    }

    // Validate required fields
    if (!appointmentId || !patientId || !slotId || !doctorId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required fields: appointmentId, patientId, slotId, doctorId"
      );
    }

    try {
      // Execute transaction
      const result = await db.runTransaction(async (transaction) => {
        // 1. Get the appointment
        const appointmentRef = db.collection("appointments").doc(appointmentId);
        const appointmentSnap = await transaction.get(appointmentRef);

        if (!appointmentSnap.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            "Appointment not found"
          );
        }

        const appointmentData = appointmentSnap.data() as AppointmentData;

        // 2. Verify appointment belongs to the patient
        if (appointmentData.patientId !== patientId) {
          throw new functions.https.HttpsError(
            "permission-denied",
            "This appointment does not belong to you"
          );
        }

        // 3. Verify appointment can be cancelled
        const cancellableStatuses = ["booked", "confirmed"];
        if (!cancellableStatuses.includes(appointmentData.status)) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            `Cannot cancel appointment with status: ${appointmentData.status}`
          );
        }

        // 4. Verify appointment has not already been cancelled
        if (appointmentData.cancelledAt) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "This appointment has already been cancelled"
          );
        }

        // 5. Verify slot reference matches
        if (appointmentData.slotId !== slotId) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "Slot ID mismatch"
          );
        }

        // 6. Get the slot
        const slotRef = db.collection("slots").doc(slotId);
        const slotSnap = await transaction.get(slotRef);

        if (!slotSnap.exists) {
          throw new functions.https.HttpsError(
            "not-found",
            "Slot not found"
          );
        }

        const slotData = slotSnap.data() as SlotData;

        // 7. Verify slot belongs to the doctor
        if (slotData.doctorId !== doctorId) {
          throw new functions.https.HttpsError(
            "failed-precondition",
            "Slot does not belong to this doctor"
          );
        }

        // 8. UPDATE APPOINTMENT
        const now = new Date().toISOString();
        transaction.update(appointmentRef, {
          status: "cancelled",
          cancelledBy: "patient",
          cancelledAt: now,
          updatedAt: now,
        });

        // 9. UPDATE SLOT
        transaction.update(slotRef, {
          status: "available",
          appointmentId: admin.firestore.FieldValue.delete(),
          updatedAt: now,
        });

        // 10. CREATE AUDIT LOG
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

      return result as CancellationResponse;
    } catch (error: any) {
      // If it's already an HttpsError, re-throw it
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      // Log unexpected errors
      console.error("Unexpected error during cancellation:", error);

      throw new functions.https.HttpsError(
        "internal",
        "An error occurred while cancelling the appointment"
      );
    }
  }
);

// ============================================================
// VERIFICATION FUNCTION
// ============================================================

/**
 * Verify that an appointment can still be cancelled
 * Used to check status before showing cancel button
 */
export const verifyAppointmentStatus = functions.https.onCall(
  async (data: { appointmentId: string }, context): Promise<{ canBeCancelled: boolean }> => {
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be logged in"
      );
    }

    const { appointmentId } = data;

    if (!appointmentId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "appointmentId is required"
      );
    }

    try {
      const appointmentSnap = await db
        .collection("appointments")
        .doc(appointmentId)
        .get();

      if (!appointmentSnap.exists) {
        return { canBeCancelled: false };
      }

      const appointmentData = appointmentSnap.data() as AppointmentData;

      // Verify user is the patient
      if (appointmentData.patientId !== context.auth.uid) {
        return { canBeCancelled: false };
      }

      const cancellableStatuses = ["booked", "confirmed"];
      const canBeCancelled = cancellableStatuses.includes(
        appointmentData.status
      ) && !appointmentData.cancelledAt;

      return { canBeCancelled };
    } catch (error) {
      console.error("Error verifying appointment status:", error);
      return { canBeCancelled: false };
    }
  }
);

// ============================================================
// CLEANUP FUNCTION (Optional - for admin)
// ============================================================

/**
 * Clean up cancelled appointments older than 90 days
 * Should be called periodically or on-demand by admin
 */
export const cleanupOldCancelledAppointments = functions.https.onCall(
  async (data, context) => {
    // Only allow admin to call this
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be logged in"
      );
    }

    // In production, verify admin role here
    // For now, just log the call

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
      const snapshot = await db
        .collection("appointments")
        .where("status", "==", "cancelled")
        .where("cancelledAt", "<", ninetyDaysAgo.toISOString())
        .get();

      let deletedCount = 0;

      // Delete in batches to avoid hitting limits
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
    } catch (error) {
      console.error("Error cleaning up appointments:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Failed to clean up appointments"
      );
    }
  }
);
