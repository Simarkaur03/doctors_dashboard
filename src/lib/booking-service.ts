import { collection, doc, getDoc, runTransaction } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface BookingResponse {
  success: boolean;
  message: string;
  appointmentId: string;
  slotId: string;
}

export async function bookAppointment(slotId: string, reason?: string): Promise<BookingResponse> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("You must be signed in to book an appointment.");
  }

  const appointmentRef = doc(collection(db, "appointments"));
  const slotRef = doc(db, "slots", slotId);
  const userRef = doc(db, "users", user.uid);

  const userSnap = await getDoc(userRef);
  const patientName = (userSnap.exists() && userSnap.data().name) || user.displayName || "Patient";

  try {
    await runTransaction(db, async (transaction) => {
      const slotSnap = await transaction.get(slotRef);
      if (!slotSnap.exists()) {
        throw new Error("This appointment slot no longer exists.");
      }
      const slot = slotSnap.data();
      if (slot.status !== "available") {
        throw new Error("This appointment slot is no longer available.");
      }
      const slotDateTime = new Date(`${slot.date}T${slot.time}:00`);
      if (Number.isNaN(slotDateTime.getTime()) || slotDateTime.getTime() < Date.now()) {
        throw new Error("You cannot book an appointment in the past.");
      }

      const now = new Date().toISOString();
      transaction.set(appointmentRef, {
        patientId: user.uid,
        patientName,
        doctorId: slot.doctorId,
        doctorName: slot.doctorName || "Doctor",
        slotId,
        date: slot.date,
        time: slot.time,
        duration: slot.duration || 30,
        status: "booked",
        reason: reason || "",
        bookedAt: now,
        createdAt: now,
        updatedAt: now,
      });

      transaction.update(slotRef, {
        status: "booked",
        appointmentId: appointmentRef.id,
        updatedAt: now,
      });
    });
  } catch (error: unknown) {
    throw new Error(error instanceof Error ? error.message : "Unable to book this appointment. Please try again.");
  }

  return {
    success: true,
    message: "Appointment booked successfully",
    appointmentId: appointmentRef.id,
    slotId,
  };
}
