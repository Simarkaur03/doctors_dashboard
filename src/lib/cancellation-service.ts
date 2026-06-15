/**
 * Appointment Cancellation Service
 * Handles communication with Firebase Cloud Function for transactional cancellations
 */

import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import type { Appointment } from "@/lib/firestore-schema";

export interface CancellationPayload {
  appointmentId: string;
  patientId: string;
  slotId: string;
  doctorId: string;
}

export interface CancellationResponse {
  success: boolean;
  message: string;
  appointmentId: string;
  slotId: string;
}

/**
 * Cancel an appointment using a Cloud Function with Firestore transaction
 */
export async function cancelAppointment(
  appointment: Appointment,
  patientId: string
): Promise<CancellationResponse> {
  try {
    const cancelAppointmentFn = httpsCallable<
      CancellationPayload,
      CancellationResponse
    >(functions, "cancelAppointment");

    const payload: CancellationPayload = {
      appointmentId: appointment.id,
      patientId,
      slotId: appointment.slotId,
      doctorId: appointment.doctorId,
    };

    const result = await cancelAppointmentFn(payload);

    return {
      success: result.data.success,
      message: result.data.message,
      appointmentId: result.data.appointmentId,
      slotId: result.data.slotId,
    };
  } catch (error: any) {
    console.error("Cancellation error:", error);

    // Handle specific Firebase error cases
    const message = error?.code === "functions/not-found"
      ? "Cancellation service is not available. Please try again later."
      : error?.message || "Unable to cancel appointment. Please try again.";

    throw new Error(message);
  }
}

/**
 * Verify if an appointment can still be cancelled (status hasn't changed)
 */
export async function verifyAppointmentStatus(appointmentId: string): Promise<boolean> {
  try {
    const verifyStatusFn = httpsCallable<
      { appointmentId: string },
      { canBeCancelled: boolean }
    >(functions, "verifyAppointmentStatus");

    const result = await verifyStatusFn({ appointmentId });
    return result.data.canBeCancelled;
  } catch (error) {
    console.error("Verification error:", error);
    return false;
  }
}
