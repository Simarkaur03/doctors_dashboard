"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import type { Appointment } from "../lib/firestore-schema";
import { canCancelAppointment } from "../lib/firestore-schema";
import { cancelAppointment } from "../lib/cancellation-service";
import { toast } from "../lib/toast";
import { formatDate } from "../lib/date-utils";
import { Calendar, Clock, Loader } from "lucide-react";
import CancellationDialog from "./CancellationDialog";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

interface AppointmentWithFormatted extends Appointment {
  formattedDate: string;
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

  useEffect(() => {
    if (!currentUser) return;

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
            displayStatus:
              data.status === "cancelled"
                ? `Cancelled${data.cancelledBy === "patient" ? " by you" : ""}`
                : data.status.charAt(0).toUpperCase() + data.status.slice(1),
          });
        });

        appointmentsList.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setAppointments(appointmentsList);
        setLoading(false);
      },
      () => {
        setError("Failed to load appointments.");
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [currentUser]);

  const handleCancelClick = useCallback((appointment: AppointmentWithFormatted) => {
    if (!canCancelAppointment(appointment.status)) return;
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
        toast.success("Appointment cancelled.");
        setCancellationDialog(null);
      } else {
        toast.error(result.message || "Unable to cancel appointment.");
      }
    } catch (err: unknown) {
      toast.error(
        (err instanceof Error ? err.message : null) || "Unable to cancel appointment."
      );
    } finally {
      setCancellingId(null);
    }
  }, [cancellationDialog, currentUser]);

  const handleCloseCancellation = useCallback(() => {
    setCancellationDialog(null);
  }, []);

  if (!currentUser) return null;

  if (error) {
    return <Card className="text-sm text-red-700">{error}</Card>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="h-6 w-6 text-[#6F8F7A] animate-spin" />
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
    <div className="space-y-4">
      <Card>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Appointments</h2>

        {activeAppointments.length === 0 ? (
          <p className="text-sm text-slate-500">No upcoming appointments.</p>
        ) : (
          <div className="space-y-2">
            {activeAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"
              >
                <div>
                  <p className="font-semibold text-slate-900">{appointment.doctorName}</p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{appointment.formattedDate}</span>
                    <Clock className="h-3.5 w-3.5" />
                    <span>{appointment.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge>{appointment.displayStatus}</Badge>
                  {canCancelAppointment(appointment.status) && (
                    <button
                      onClick={() => handleCancelClick(appointment)}
                      className="rounded-lg border border-[#C97B7B] px-3 py-1.5 text-sm font-semibold text-[#C97B7B] transition-colors hover:bg-[#F7EDEC] disabled:opacity-50"
                      disabled={cancellingId === appointment.id}
                    >
                      {cancellingId === appointment.id ? "Cancelling…" : "Cancel"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {pastAppointments.length > 0 && (
        <Card>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Past</h2>
          <div className="space-y-2">
            {pastAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3 opacity-75"
              >
                <div>
                  <p className="font-semibold text-slate-900">{appointment.doctorName}</p>
                  <p className="text-sm text-slate-500">
                    {appointment.formattedDate} at {appointment.time}
                  </p>
                </div>
                <Badge>{appointment.displayStatus}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      <CancellationDialog
        appointment={cancellationDialog}
        isLoading={cancellingId !== null}
        onConfirm={handleConfirmCancellation}
        onCancel={handleCloseCancellation}
      />
    </div>
  );
}
