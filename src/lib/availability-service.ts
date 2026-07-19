import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  deleteDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { toLocalDateString } from "./date-utils";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export interface RecurringAvailability {
  doctorId: string;
  day: Weekday;
  enabled: boolean;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

const availabilityRef = collection(db, "availability");
const slotsRef = collection(db, "slots");

export async function fetchRecurringAvailability(doctorId: string): Promise<Record<Weekday, RecurringAvailability>> {
  const result = {} as Record<Weekday, RecurringAvailability>;
  for (const day of WEEKDAYS) {
    const snap = await getDoc(doc(availabilityRef, `${doctorId}_${day}`));
    result[day] = snap.exists()
      ? (snap.data() as RecurringAvailability)
      : { doctorId, day, enabled: false, startTime: "09:00", endTime: "17:00", slotDuration: 30 };
  }
  return result;
}

export async function saveRecurringAvailability(entry: RecurringAvailability): Promise<void> {
  await setDoc(doc(availabilityRef, `${entry.doctorId}_${entry.day}`), entry);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function generateTimesInRange(startTime: string, endTime: string, duration: number): string[] {
  const times: string[] = [];
  let cursor = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  while (cursor + duration <= end) {
    times.push(minutesToTime(cursor));
    cursor += duration;
  }
  return times;
}

const dayIndexToWeekday: Weekday[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function generateUpcomingSlots(
  doctorId: string,
  doctorName: string,
  daysAhead: number
): Promise<number> {
  const availability = await fetchRecurringAvailability(doctorId);
  const now = new Date();
  let created = 0;

  for (let offset = 0; offset < daysAhead; offset += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    const dateStr = toLocalDateString(date);
    const weekday = dayIndexToWeekday[date.getDay()];
    const dayConfig = availability[weekday];
    if (!dayConfig.enabled) continue;

    const existingSnap = await getDocs(query(slotsRef, where("doctorId", "==", doctorId), where("date", "==", dateStr)));
    const existingTimes = new Set(existingSnap.docs.map((d) => d.data().time as string));

    const times = generateTimesInRange(dayConfig.startTime, dayConfig.endTime, dayConfig.slotDuration);
    for (const time of times) {
      if (existingTimes.has(time)) continue;
      if (offset === 0 && timeToMinutes(time) <= now.getHours() * 60 + now.getMinutes()) continue;

      const slotId = `${doctorId}_${dateStr}_${time}`;
      await setDoc(doc(slotsRef, slotId), {
        doctorId,
        doctorName,
        date: dateStr,
        time,
        duration: dayConfig.slotDuration,
        status: "available",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      created += 1;
    }
  }

  return created;
}

export async function addSingleSlot(
  doctorId: string,
  doctorName: string,
  date: string,
  time: string,
  duration: number
): Promise<void> {
  const slotId = `${doctorId}_${date}_${time}`;
  const existing = await getDoc(doc(slotsRef, slotId));
  if (existing.exists()) {
    throw new Error("A slot already exists at this date and time.");
  }
  await setDoc(doc(slotsRef, slotId), {
    doctorId,
    doctorName,
    date,
    time,
    duration,
    status: "available",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function removeSlot(slotId: string): Promise<void> {
  await deleteDoc(doc(slotsRef, slotId));
}

export async function setSlotBlocked(slotId: string, blocked: boolean): Promise<void> {
  await updateDoc(doc(slotsRef, slotId), {
    status: blocked ? "unavailable" : "available",
    updatedAt: serverTimestamp(),
  });
}
