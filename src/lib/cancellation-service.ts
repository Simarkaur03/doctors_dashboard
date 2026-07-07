/**
 * Appointment Cancellation Service
 * Cancels an appointment with a Firestore batched write (patient's own
 * appointment -> cancelled, linked slot -> available again).
 */

import { doc, writeBatch } from "firebase/firestore";
import { db } from "./firebase";
import type { Appointment } from "./firestore-schema";

export interface CancellationResponse {
  success: boolean;
  message: string;
  appointmentId: string;
  slotId: string;
}

export async function cancelAppointment(
  appointment: Appointment,
  patientId: string
): Promise<CancellationResponse> {
  if (appointment.patientId !== patientId) {
    throw new Error("This appointment does not belong to you.");
  }

  try {
    const now = new Date().toISOString();
    const batch = writeBatch(db);

    batch.update(doc(db, "appointments", appointment.id), {
      status: "cancelled",
      cancelledBy: "patient",
      cancelledAt: now,
      updatedAt: now,
    });

    if (appointment.slotId) {
      batch.update(doc(db, "slots", appointment.slotId), {
        status: "available",
        appointmentId: null,
        updatedAt: now,
      });
    }

    await batch.commit();

    return {
      success: true,
      message: "Appointment cancelled successfully",
      appointmentId: appointment.id,
      slotId: appointment.slotId,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to cancel appointment. Please try again.";
    throw new Error(message);
  }
}
