import { db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export interface PatientProfile {
  name: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  role: string;
}

export async function fetchUserProfile(uid: string): Promise<PatientProfile | null> {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return {
    name: data.name || "",
    email: data.email || "",
    phone: data.phone || "",
    dateOfBirth: data.dateOfBirth || "",
    role: data.role || "patient",
  };
}

export async function saveUserProfile(
  uid: string,
  updates: { name: string; phone: string; dateOfBirth?: string }
): Promise<void> {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    name: updates.name,
    phone: updates.phone,
    dateOfBirth: updates.dateOfBirth || "",
  });
}
