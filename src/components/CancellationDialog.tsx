"use client";

import React from "react";
import type { Appointment } from "../lib/firestore-schema";

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
      <div className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-5">
        <h2 className="text-base font-semibold text-slate-900">Cancel Appointment</h2>

        <div className="mt-4 space-y-1 rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Doctor</span>
            <span className="font-medium text-slate-900">{appointment.doctorName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Date</span>
            <span className="font-medium text-slate-900">
              {new Date(appointment.date).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Time</span>
            <span className="font-medium text-slate-900">{appointment.time}</span>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-900 transition duration-150 hover:bg-slate-50 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            Keep
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-lg px-4 py-2 text-sm font-semibold text-white bg-red-600 shadow-sm transition duration-150 hover:bg-red-700 hover:shadow-md active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
          >
            {isLoading ? "Cancelling…" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
