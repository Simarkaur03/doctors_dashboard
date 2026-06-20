import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  runTransaction,
  writeBatch,
  serverTimestamp,
  updateDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { appointmentsRef, slotsRef } from "./firestore-schema";

export type BookingStatus = "pending" | "confirmed" | "cancelled";

export interface PatientAppointment {
  id: string;
  uid: string;
  patientName: string;
  date: string;
  time: string;
  reason?: string;
  status: BookingStatus;
  createdAt: any;
  doctorName: string;
  doctorId: string;
  slotId?: string;
}

export interface PatientSlot {
  id: string;
  doctorId: string;
  doctorName: string;
  date: string;
  time: string;
  status: "available" | "booked" | "unavailable";
  appointmentId?: string;
}

export interface PatientNotification {
  id: string;
  uid: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export interface PatientProfile {
  name: string;
  email: string;
  phone?: string;
  role: string;
}

function mapAppointment(docSnap: QueryDocumentSnapshot<DocumentData>): PatientAppointment {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    uid: data.uid,
    patientName: data.patientName,
    date: data.date,
    time: data.time,
    reason: data.reason || "",
    status: data.status,
    createdAt: data.createdAt,
    doctorName: data.doctorName || "Doctor",
    doctorId: data.doctorId || "",
    slotId: data.slotId,
  };
}

function mapSlot(docSnap: QueryDocumentSnapshot<DocumentData>): PatientSlot {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    doctorId: data.doctorId || "",
    doctorName: data.doctorName || "Doctor",
    date: data.date,
    time: data.time,
    status: data.status,
    appointmentId: data.appointmentId,
  };
}

function mapNotification(docSnap: QueryDocumentSnapshot<DocumentData>): PatientNotification {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    uid: data.uid,
    message: data.message,
    read: data.read === true,
    createdAt: data.createdAt,
  };
}

export async function fetchNextAppointment(
  uid: string
): Promise<PatientAppointment | null> {
  const today = new Date().toISOString().slice(0, 10);
  const q = query(
    appointmentsRef,
    where("uid", "==", uid),
    where("status", "in", ["pending", "confirmed"]),
    where("date", ">=", today),
    orderBy("date", "asc"),
    orderBy("time", "asc"),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  return mapAppointment(snapshot.docs[0]);
}

export async function fetchSlotsForDate(date: string): Promise<PatientSlot[]> {
  const q = query(slotsRef, where("date", "==", date), orderBy("time", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapSlot);
}

export async function bookAppointment(
  uid: string,
  patientName: string,
  date: string,
  time: string,
  reason: string,
  slot: PatientSlot
): Promise<PatientAppointment> {
  const appointmentRef = doc(appointmentsRef);
  const slotRef = doc(slotsRef, slot.id);

  await runTransaction(db, async (transaction) => {
    const currentSlot = await transaction.get(slotRef);
    if (!currentSlot.exists()) {
      throw new Error("This appointment slot is no longer available.");
    }
    const slotData = currentSlot.data();
    if (slotData.status !== "available") {
      throw new Error("This appointment slot is no longer available.");
    }

    transaction.set(appointmentRef, {
      uid,
      patientName,
      date,
      time,
      reason: reason || "",
      status: "pending",
      doctorName: slot.doctorName,
      doctorId: slot.doctorId,
      slotId: slot.id,
      createdAt: serverTimestamp(),
    });

    transaction.update(slotRef, {
      status: "booked",
      appointmentId: appointmentRef.id,
    });
  });

  return {
    id: appointmentRef.id,
    uid,
    patientName,
    date,
    time,
    reason,
    status: "pending",
    createdAt: null,
    doctorName: slot.doctorName,
    doctorId: slot.doctorId,
    slotId: slot.id,
  };
}

export async function fetchAppointmentsForPatient(
  uid: string
): Promise<PatientAppointment[]> {
  const q = query(
    appointmentsRef,
    where("uid", "==", uid),
    orderBy("date", "desc"),
    orderBy("time", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapAppointment);
}

export async function cancelAppointment(
  appointmentId: string,
  slotId?: string
): Promise<void> {
  const appointmentRef = doc(appointmentsRef, appointmentId);
  const batch = writeBatch(db);
  batch.update(appointmentRef, {
    status: "cancelled",
    updatedAt: serverTimestamp(),
    cancelledBy: "patient",
    cancelledAt: serverTimestamp(),
  });
  if (slotId) {
    const slotRef = doc(slotsRef, slotId);
    batch.update(slotRef, {
      status: "available",
      appointmentId: null,
    });
  }
  await batch.commit();
}

export async function fetchNotifications(
  uid: string
): Promise<PatientNotification[]> {
  const notificationsRef = collection(db, "notifications");
  const q = query(
    notificationsRef,
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(mapNotification);
}

export async function markNotificationRead(
  notificationId: string
): Promise<void> {
  const notificationRef = doc(db, "notifications", notificationId);
  await updateDoc(notificationRef, { read: true });
}

export async function markAllNotificationsRead(uid: string): Promise<void> {
  const notificationsRef = collection(db, "notifications");
  const q = query(
    notificationsRef,
    where("uid", "==", uid),
    where("read", "==", false)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.docs.forEach((docSnap) => {
    batch.update(doc(db, "notifications", docSnap.id), { read: true });
  });
  if (snapshot.size > 0) {
    await batch.commit();
  }
}

export async function fetchUserProfile(
  uid: string
): Promise<PatientProfile | null> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    role: data.role || "patient",
  };
}

export async function saveUserProfile(
  uid: string,
  name: string,
  phone: string
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    name,
    phone,
  });
}
