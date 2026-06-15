/**
 * useAppointment Hook
 * Provides appointment-related operations and state management
 */

"use client";

import { useCallback, useState } from "react";
import type { Appointment } from "@/lib/firestore-schema";
import { cancelAppointment } from "@/lib/cancellation-service";
import { toast } from "@/lib/toast";

export interface UseAppointmentResult {
  cancelling: string | null;
  error: string | null;
  handleCancel: (appointment: Appointment, patientId: string) => Promise<boolean>;
}

/**
 * Hook for managing appointment operations
 */
export function useAppointment(): UseAppointmentResult {
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = useCallback(
    async (appointment: Appointment, patientId: string): Promise<boolean> => {
      setCancelling(appointment.id);
      setError(null);

      try {
        const result = await cancelAppointment(appointment, patientId);

        if (result.success) {
          toast.success(
            "Appointment cancelled successfully. The slot is now available for booking."
          );
          return true;
        } else {
          const errorMsg =
            result.message || "Unable to cancel appointment. Please try again.";
          setError(errorMsg);
          toast.error(errorMsg);
          return false;
        }
      } catch (err: any) {
        const errorMsg =
          err.message || "An error occurred while cancelling the appointment";
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("Cancellation error:", err);
        return false;
      } finally {
        setCancelling(null);
      }
    },
    []
  );

  return {
    cancelling,
    error,
    handleCancel,
  };
}
