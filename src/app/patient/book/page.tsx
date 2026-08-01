"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Loader2 } from "lucide-react";
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
import { toLocalDateString } from "../../../lib/date-utils";
import { PageContainer } from "../../../components/ui/PageContainer";

function todayISO() {
  return toLocalDateString();
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
      toast.success("Appointment booked.");
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
      <PageContainer>
        <Card>
          <div className="max-w-xs">
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
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          ) : slotsByDoctor.length === 0 ? (
            <p className="text-sm text-slate-500">No slots available on this date.</p>
          ) : (
            <div className="space-y-6">
              {slotsByDoctor.map((group) => (
                <div key={group.doctorName}>
                  <h2 className="mb-2 text-sm font-semibold text-slate-900">{group.doctorName}</h2>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {group.slots.map((slot) => (
                      <SlotCard key={slot.id} slot={slot} onClick={(s) => setSelectedSlot(slots.find((x) => x.id === s.id) || null)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageContainer>

      {/* Fixed-position overlay, so it sits outside the page frame. */}
      {selectedSlot ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-base font-semibold text-slate-900">Confirm Booking</h2>
            <p className="mt-1 text-sm text-slate-600">
              {selectedSlot.doctorName} • {selectedSlot.date} • {selectedSlot.time}
            </p>
            <div className="mt-4">
              <Input
                label="Reason (optional)"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
              />
            </div>
            <div className="mt-4 flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setSelectedSlot(null)} disabled={booking}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleConfirmBooking} disabled={booking}>
                {booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirm
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AuthGuard>
  );
}
