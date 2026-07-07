export type UserRole = "patient" | "doctor" | "admin";

export interface AppUser {
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Doctor {
  uid: string;
  name: string;
  email: string;
  specialty?: string;
  phone?: string;
  bio?: string;
  role: "doctor";
}

export interface Patient {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  role: "patient";
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorName: string;
  doctorId: string;
  date: string;
  time: string;
  status: "booked" | "confirmed" | "cancelled" | "completed" | "no-show";
  reason?: string;
  createdAt?: string;
  slotId?: string;
}

export interface Slot {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  duration: number;
  status: "available" | "booked" | "unavailable";
  appointmentId?: string;
  createdAt?: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt?: string;
}

export interface HealthReport {
  id: string;
  patientId: string;
  title: string;
  summary: string;
  createdAt?: string;
}

export interface DoctorNote {
  id: string;
  doctorId: string;
  patientId: string;
  content: string;
  createdAt?: string;
}

export interface Availability {
  id: string;
  doctorId: string;
  day: string;
  startTime: string;
  endTime: string;
}

export interface DashboardStats {
  appointments: number;
  patients: number;
  pending: number;
  completed: number;
}
