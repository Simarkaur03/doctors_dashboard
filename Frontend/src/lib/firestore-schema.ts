/**
 * Firestore Database Schema
 * Defines types and collection references for the doctor appointment system
 */

import { db } from "./firebase";
import { collection } from "firebase/firestore";

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  slotId: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  duration: number; // minutes
  status: "booked" | "confirmed" | "completed" | "cancelled" | "no-show";
  cancelledBy?: "patient" | "doctor" | "admin";
  cancelledAt?: string; // ISO timestamp
  bookedAt: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface Slot {
  id: string;
  doctorId: string;
  date: string; // ISO date string
  time: string; // HH:mm format
  duration: number; // minutes
  status: "available" | "booked" | "unavailable";
  appointmentId?: string; // Reference to booked appointment
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

export interface AuditLog {
  id: string;
  action:
    | "appointment_cancelled"
    | "appointment_booked"
    | "appointment_completed"
    | "appointment_no_show"
    | "slot_created"
    | "slot_deleted";
  appointmentId?: string;
  patientId?: string;
  doctorId?: string;
  slotId?: string;
  performedBy: "patient" | "doctor" | "admin" | "system";
  details?: Record<string, any>;
  timestamp: string; // ISO timestamp
  createdAt: string; // ISO timestamp
}

// ============================================================
// COLLECTION REFERENCES
// ============================================================

export const appointmentsRef = collection(db, "appointments");
export const slotsRef = collection(db, "slots");
export const auditLogsRef = collection(db, "auditLogs");

// ============================================================
// CANCELLATION-ELIGIBLE STATUS
// ============================================================

export const CANCELLATION_ELIGIBLE_STATUSES = ["booked", "confirmed"] as const;

export function canCancelAppointment(
  status: Appointment["status"]
): boolean {
  return CANCELLATION_ELIGIBLE_STATUSES.includes(status as any);
}

// ============================================================
// FIRESTORE RULES (Reference - deploy separately)
// ============================================================

/**
Firestore Security Rules:

rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read their own appointments
    match /appointments/{appointmentId} {
      allow read: if request.auth != null && 
                    (request.auth.uid == resource.data.patientId || 
                     request.auth.uid == resource.data.doctorId);
      allow create: if request.auth != null &&
                      request.resource.data.patientId == request.auth.uid &&
                      request.resource.data.status in ['booked', 'confirmed'];
    }

    // Allow authenticated users to read available slots
    match /slots/{slotId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                      request.auth.uid == resource.data.doctorId;
    }

    // Allow users to read their own audit logs
    match /auditLogs/{logId} {
      allow read: if request.auth != null &&
                    (request.auth.uid == resource.data.patientId || 
                     request.auth.uid == resource.data.doctorId);
      allow create: if request.auth != null;
    }
  }
}
 */
