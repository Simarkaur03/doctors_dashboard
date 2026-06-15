"use client";

import React from "react";
import { AlertCircle, X } from "lucide-react";
import type { Appointment } from "@/lib/firestore-schema";

interface CancellationDialogProps {
  appointment: Appointment | null;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CancellationDialog({
  appointment,
  isLoading,
  onConfirm,
  onCancel,
}: CancellationDialogProps) {
  if (!appointment) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-2xl border border-[#DDE8E1] shadow-lg max-w-sm w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#DDE8E1]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-50">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-[#24302A]">
              Cancel Appointment
            </h2>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-[#93A19A] hover:text-[#66736D] transition-colors disabled:opacity-50"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-[#66736D]">
              Are you sure you want to cancel this appointment?
            </p>
            <p className="text-xs text-[#93A19A]">
              This action cannot be undone. The slot will immediately become
              available for other patients.
            </p>
          </div>

          {/* Appointment Details */}
          <div className="bg-[#F7F9F8] rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#93A19A]">Doctor</span>
              <span className="font-medium text-[#24302A]">{appointment.doctorName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#93A19A]">Date</span>
              <span className="font-medium text-[#24302A]">
                {new Date(appointment.date).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#93A19A]">Time</span>
              <span className="font-medium text-[#24302A]">{appointment.time}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[#93A19A]">Duration</span>
              <span className="font-medium text-[#24302A]">{appointment.duration} minutes</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-[#DDE8E1]">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-[#DDE8E1] px-4 py-2 text-sm font-semibold text-[#24302A] bg-white transition-colors hover:bg-[#FAFCFB] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep Appointment
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-red-600 transition-colors hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Cancelling..." : "Cancel Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}
