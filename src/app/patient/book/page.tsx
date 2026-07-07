"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Loader2, CalendarDays } from "lucide-react";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import SlotCard from "../../../components/SlotCard";
import { bookAppointment } from "../../../lib/booking-service";
import { toast } from "../../../lib/toast";
import type { Slot } from "../../../lib/firestore-schema";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function PatientBookPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadedDate, setLoadedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState("");
  const [booking, setBooking] = useState(false);
  const loading = loadedDate !== date;

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "slots"), where("date", "==", date)),
      (snapshot) => {
        setSlots(snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as Omit<Slot, "id">) })));
        setLoadedDate(date);
      },
      () => setLoadedDate(date)
    );
    return () => unsubscribe();
  }, [date]);

  const slotsByDoctor = useMemo(() => {
    const groups = new Map<string, { doctorName: string; slots: Slot[] }>();
    for (const slot of slots) {
      const group = groups.get(slot.doctorId) || { doctorName: slot.doctorName || "Doctor", slots: [] };
      group.slots.push(slot);
      groups.set(slot.doctorId, group);
    }
    for (const group of groups.values()) {
      group.slots.sort((a, b) => a.time.localeCompare(b.time));
    }
    return Array.from(groups.values());
  }, [slots]);

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !user) return;
    setBooking(true);
    try {
      await bookAppointment(selectedSlot.id, reason.trim());
      toast.success("Appointment booked successfully.");
      setSelectedSlot(null);
      setReason("");
      router.push("/patient/appointments");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to book this appointment.");
    } finally {
      setBooking(false);
    }
  };

  return (
    <AuthGuard requiredRole="patient">
      <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-8">
        <div className="mx-auto max-w-4xl space-y-6">
          <Card>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#4D694E]">Book a visit</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Choose a date and time</h1>
            <div className="mt-6 max-w-xs">
              <Input
                label="Date"
                type="date"
                value={date}
                min={todayISO()}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </Card>

          <Card>
            {loading ? (
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading available times…
              </div>
            ) : slotsByDoctor.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-10 text-center text-sm text-slate-500">
                <CalendarDays className="mx-auto mb-3 h-10 w-10 text-slate-300" />
                No slots are available on this date. Try another day.
              </div>
            ) : (
              <div className="space-y-8">
                {slotsByDoctor.map((group) => (
                  <div key={group.doctorName}>
                    <h2 className="mb-3 text-lg font-semibold text-slate-900">{group.doctorName}</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {group.slots.map((slot) => (
                        <SlotCard key={slot.id} slot={slot} onClick={(s) => setSelectedSlot(slots.find((x) => x.id === s.id) || null)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {selectedSlot ? (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900">Confirm booking</h2>
              <p className="mt-2 text-sm text-slate-600">
                {selectedSlot.doctorName} • {selectedSlot.date} • {selectedSlot.time}
              </p>
              <div className="mt-4">
                <Input
                  label="Reason for visit (optional)"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
              </div>
              <div className="mt-6 flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setSelectedSlot(null)} disabled={booking}>
                  Cancel
                </Button>
                <Button className="flex-1" onClick={handleConfirmBooking} disabled={booking}>
                  {booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {booking ? "Booking" : "Confirm"}
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </AuthGuard>
  );
}
