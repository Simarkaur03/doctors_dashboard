"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import type { Appointment } from "../lib/firestore-schema";
import {
  canCancelAppointment,
  CANCELLATION_ELIGIBLE_STATUSES,
} from "../lib/firestore-schema";
import { cancelAppointment } from "../lib/cancellation-service";
import { toast } from "../lib/toast";
import { formatDate, formatTime } from "../lib/date-utils";
import { Calendar, Clock, User, AlertCircle, Loader } from "lucide-react";
import CancellationDialog from "./CancellationDialog";

interface AppointmentWithFormatted extends Appointment {
  formattedDate: string;
  formattedDateTime: string;
  displayStatus: string;
}

export default function MyAppointments() {
  const [appointments, setAppointments] = useState<AppointmentWithFormatted[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [cancellationDialog, setCancellationDialog] = useState<Appointment | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentUser = auth.currentUser;

  // Subscribe to real-time appointment updates
  useEffect(() => {
    if (!currentUser) {
      setError("You must be logged in to view your appointments");
      setLoading(false);
      return;
    }

    setLoading(true);
    const appointmentsQuery = query(
      collection(db, "appointments"),
      where("patientId", "==", currentUser.uid)
    );

    const unsubscribe = onSnapshot(
      appointmentsQuery,
      (snapshot) => {
        const appointmentsList: AppointmentWithFormatted[] = [];
        snapshot.forEach((doc) => {
          const data = doc.data() as Appointment;
          appointmentsList.push({
            ...data,
            id: doc.id,
            formattedDate: formatDate(data.date),
            formattedDateTime: `${formatDate(data.date)} at ${data.time}`,
            displayStatus:
              data.status === "cancelled"
                ? `Cancelled${data.cancelledBy === "patient" ? " by you" : ""}`
                : data.status.charAt(0).toUpperCase() + data.status.slice(1),
          });
        });

        // Sort by date, newest first
        appointmentsList.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setAppointments(appointmentsList);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching appointments:", error);
        setError("Failed to load appointments. Please try again.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const handleCancelClick = useCallback((appointment: AppointmentWithFormatted) => {
    if (!canCancelAppointment(appointment.status)) {
      toast.warning(`Cannot cancel ${appointment.status} appointments`);
      return;
    }
    setCancellationDialog(appointment);
  }, []);

  const handleConfirmCancellation = useCallback(async () => {
    if (!cancellationDialog || !currentUser) return;

    setCancellingId(cancellationDialog.id);
    try {
      const result = await cancelAppointment(
        cancellationDialog,
        currentUser.uid
      );

      if (result.success) {
        toast.success("Appointment cancelled successfully. The slot is now available for booking.");
        setCancellationDialog(null);
      } else {
        toast.error(result.message || "Unable to cancel appointment. Please try again.");
      }
    } catch (err: any) {
      console.error("Cancellation failed:", err);
      toast.error(
        err.message || "Unable to cancel appointment. Please try again."
      );
    } finally {
      setCancellingId(null);
    }
  }, [cancellationDialog, currentUser]);

  const handleCloseCancellation = useCallback(() => {
    setCancellationDialog(null);
  }, []);

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-[#DDE8E1] bg-white p-10 text-center shadow-sm">
        <AlertCircle className="mx-auto h-12 w-12 text-[#DDE8E1]" />
        <p className="mt-3 text-sm text-[#93A19A]">
          Please log in to view your appointments
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900">Error Loading Appointments</h3>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-8 w-8 text-[#6F8F7A] animate-spin" />
      </div>
    );
  }

  const activeAppointments = appointments.filter(
    (a) => !["cancelled", "completed"].includes(a.status)
  );
  const pastAppointments = appointments.filter((a) =>
    ["cancelled", "completed"].includes(a.status)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl bg-white p-6 border border-[#DDE8E1] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6F8F7A]/10 text-[#6F8F7A]">
            <Calendar className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[#24302A]">
              My Appointments
            </h1>
            <p className="text-sm text-[#66736D]">
              View and manage your upcoming appointments
            </p>
          </div>
        </div>
      </div>

      {/* Active Appointments */}
      <div className="rounded-2xl bg-white p-6 border border-[#DDE8E1] shadow-sm">
        <h2 className="text-lg font-semibold text-[#24302A] mb-4">
          Upcoming Appointments
        </h2>

        {activeAppointments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#DDE8E1] bg-[#FAFCFB] p-10 text-center">
            <Calendar className="mx-auto h-12 w-12 text-[#DDE8E1]" />
            <p className="mt-3 text-sm text-[#93A19A]">
              No upcoming appointments. Book one to get started!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border border-[#DDE8E1] bg-[#FAFCFB] p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                  <div className="space-y-3">
                    {/* Doctor and Date/Time */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#6F8F7A]" />
                        <span className="font-semibold text-[#24302A]">
                          {appointment.doctorName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#66736D]">
                        <Calendar className="h-4 w-4" />
                        <span>{appointment.formattedDate}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#66736D]">
                        <Clock className="h-4 w-4" />
                        <span>{appointment.time}</span>
                        <span>•</span>
                        <span>{appointment.duration} minutes</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold"
                        style={{
                          backgroundColor:
                            appointment.status === "booked"
                              ? "#EEF4F0"
                              : "#EBF3ED",
                          color:
                            appointment.status === "booked"
                              ? "#4F6B5A"
                              : "#7BAA88",
                        }}
                      >
                        {appointment.displayStatus}
                      </span>
                    </div>
                  </div>

                  {/* Cancel Button */}
                  <div className="flex items-center gap-2">
                    {canCancelAppointment(appointment.status) && (
                      <button
                        onClick={() => handleCancelClick(appointment)}
                        className="rounded-lg border border-[#C97B7B] px-4 py-2 text-sm font-semibold text-[#C97B7B] transition-colors hover:bg-[#F7EDEC] disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={cancellingId === appointment.id}
                      >
                        {cancellingId === appointment.id
                          ? "Cancelling..."
                          : "Cancel"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      {pastAppointments.length > 0 && (
        <div className="rounded-2xl bg-white p-6 border border-[#DDE8E1] shadow-sm">
          <h2 className="text-lg font-semibold text-[#24302A] mb-4">
            Past Appointments
          </h2>
          <div className="space-y-3">
            {pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="rounded-2xl border border-[#DDE8E1] bg-[#FAFCFB] p-4 shadow-sm opacity-75"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#6F8F7A]" />
                        <span className="font-semibold text-[#24302A]">
                          {appointment.doctorName}
                        </span>
                      </div>
                      <p className="text-sm text-[#66736D] mt-1">
                        {appointment.formattedDate} at {appointment.time}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-3 py-1 text-xs font-semibold"
                      style={{
                        backgroundColor:
                          appointment.status === "cancelled"
                            ? "#F7EDEC"
                            : "#EBF3ED",
                        color:
                          appointment.status === "cancelled"
                            ? "#C97B7B"
                            : "#7BAA88",
                      }}
                    >
                      {appointment.displayStatus}
                    </span>
                  </div>
                  {appointment.status === "cancelled" && (
                    <p className="text-xs text-[#93A19A]">
                      Cancelled on{" "}
                      {appointment.cancelledAt
                        ? formatDate(appointment.cancelledAt)
                        : "unknown date"}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation Dialog */}
      <CancellationDialog
        appointment={cancellationDialog}
        isLoading={cancellingId !== null}
        onConfirm={handleConfirmCancellation}
        onCancel={handleCloseCancellation}
      />
    </div>
  );
}
