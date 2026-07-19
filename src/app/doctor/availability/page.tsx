"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { Loader2, Trash2, Ban, CheckCircle2 } from "lucide-react";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { toast } from "../../../lib/toast";
import {
  WEEKDAYS,
  type RecurringAvailability,
  type Weekday,
  fetchRecurringAvailability,
  saveRecurringAvailability,
  generateUpcomingSlots,
  addSingleSlot,
  removeSlot,
  setSlotBlocked,
} from "../../../lib/availability-service";
import type { Slot } from "../../../lib/firestore-schema";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function DoctorAvailabilityPage() {
  const { user } = useAuth();
  const [doctorName, setDoctorName] = useState("Doctor");
  const [recurring, setRecurring] = useState<Record<Weekday, RecurringAvailability> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Weekday | null>(null);
  const [generating, setGenerating] = useState(false);

  const [date, setDate] = useState(todayISO());
  const [slots, setSlots] = useState<Slot[]>([]);
  const [newTime, setNewTime] = useState("09:00");
  const [newDuration, setNewDuration] = useState(30);
  const [addingSlot, setAddingSlot] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    getDoc(doc(db, "users", user.uid)).then((snap) => {
      if (snap.exists()) setDoctorName((snap.data().name as string) || "Doctor");
    });
    fetchRecurringAvailability(user.uid)
      .then(setRecurring)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(
      query(collection(db, "slots"), where("doctorId", "==", user.uid), where("date", "==", date)),
      (snapshot) => {
        setSlots(
          snapshot.docs
            .map((d) => ({ id: d.id, ...(d.data() as Omit<Slot, "id">) }))
            .sort((a, b) => a.time.localeCompare(b.time))
        );
      }
    );
    return () => unsubscribe();
  }, [user, date]);

  const handleDayChange = (day: Weekday, updates: Partial<RecurringAvailability>) => {
    if (!recurring) return;
    setRecurring({ ...recurring, [day]: { ...recurring[day], ...updates } });
  };

  const handleSaveDay = async (day: Weekday) => {
    if (!recurring || !user?.uid) return;
    setSaving(day);
    try {
      await saveRecurringAvailability({ ...recurring[day], doctorId: user.uid, day });
      toast.success(`${day} hours saved.`);
    } catch {
      toast.error("Could not save availability. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const handleGenerate = async () => {
    if (!user?.uid) return;
    setGenerating(true);
    try {
      const created = await generateUpcomingSlots(user.uid, doctorName, 14);
      toast.success(`Generated ${created} new slot${created === 1 ? "" : "s"} for the next 14 days.`);
    } catch {
      toast.error("Could not generate slots. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddSlot = async () => {
    if (!user?.uid) return;
    if (date < todayISO()) {
      toast.error("You cannot add a slot in the past.");
      return;
    }
    setAddingSlot(true);
    try {
      await addSingleSlot(user.uid, doctorName, date, newTime, newDuration);
      toast.success("Slot added.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add slot.");
    } finally {
      setAddingSlot(false);
    }
  };

  const handleRemoveSlot = async (slot: Slot) => {
    if (slot.status === "booked") {
      toast.warning("This slot is booked. Cancel the appointment before removing it.");
      return;
    }
    try {
      await removeSlot(slot.id);
      toast.success("Slot removed.");
    } catch {
      toast.error("Could not remove slot.");
    }
  };

  const handleToggleBlock = async (slot: Slot) => {
    if (slot.status === "booked") {
      toast.warning("This slot is booked and cannot be blocked.");
      return;
    }
    try {
      await setSlotBlocked(slot.id, slot.status !== "unavailable");
      toast.success(slot.status === "unavailable" ? "Slot unblocked." : "Slot blocked.");
    } catch {
      toast.error("Could not update slot.");
    }
  };

  return (
    <AuthGuard requiredRole="doctor">
      <main className="bg-[#FFF3D5] p-4 md:p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <h1 className="text-xl font-semibold text-slate-900">Availability</h1>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">Weekly Hours</h2>

            {loading || !recurring ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-slate-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {WEEKDAYS.map((day) => {
                  const config = recurring[day];
                  return (
                    <div key={day} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 p-4">
                      <label className="flex w-24 items-center gap-2 text-sm font-semibold text-slate-800">
                        <input
                          type="checkbox"
                          checked={config.enabled}
                          onChange={(event) => handleDayChange(day, { enabled: event.target.checked })}
                        />
                        {day}
                      </label>
                      <input
                        type="time"
                        value={config.startTime}
                        disabled={!config.enabled}
                        onChange={(event) => handleDayChange(day, { startTime: event.target.value })}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                      />
                      <span className="text-sm text-slate-500">to</span>
                      <input
                        type="time"
                        value={config.endTime}
                        disabled={!config.enabled}
                        onChange={(event) => handleDayChange(day, { endTime: event.target.value })}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                      />
                      <select
                        value={config.slotDuration}
                        disabled={!config.enabled}
                        onChange={(event) => handleDayChange(day, { slotDuration: Number(event.target.value) })}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm disabled:opacity-50"
                      >
                        {[15, 20, 30, 45, 60].map((minutes) => (
                          <option key={minutes} value={minutes}>
                            {minutes} min
                          </option>
                        ))}
                      </select>
                      <Button size="sm" variant="secondary" onClick={() => handleSaveDay(day)} disabled={saving === day}>
                        {saving === day ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  );
                })}

                <Button className="mt-2" onClick={handleGenerate} disabled={generating}>
                  {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {generating ? "Generating…" : "Generate Slots"}
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-base font-semibold text-slate-900">Slots</h2>
            <div className="mt-3 max-w-xs">
              <Input label="Date" type="date" value={date} min={todayISO()} onChange={(event) => setDate(event.target.value)} />
            </div>

            <div className="mt-4 flex flex-wrap items-end gap-3 rounded-2xl bg-slate-50 p-4">
              <label className="text-sm text-slate-600">
                Time
                <input
                  type="time"
                  value={newTime}
                  onChange={(event) => setNewTime(event.target.value)}
                  className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm text-slate-600">
                Duration
                <select
                  value={newDuration}
                  onChange={(event) => setNewDuration(Number(event.target.value))}
                  className="mt-1 block rounded-xl border border-slate-200 px-3 py-2 text-sm"
                >
                  {[15, 20, 30, 45, 60].map((minutes) => (
                    <option key={minutes} value={minutes}>
                      {minutes} min
                    </option>
                  ))}
                </select>
              </label>
              <Button size="sm" onClick={handleAddSlot} disabled={addingSlot}>
                {addingSlot ? "Adding…" : "Add slot"}
              </Button>
            </div>

            <div className="mt-4 space-y-2">
              {slots.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                  No slots for this date yet.
                </p>
              ) : (
                slots.map((slot) => (
                  <div key={slot.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                    <div>
                      <p className="font-semibold text-slate-900">{slot.time}</p>
                      <p className="text-xs text-slate-500">
                        {slot.duration} min • {slot.status}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleBlock(slot)}
                        className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                        aria-label={slot.status === "unavailable" ? "Unblock slot" : "Block slot"}
                        title={slot.status === "unavailable" ? "Unblock slot" : "Block slot"}
                      >
                        {slot.status === "unavailable" ? <CheckCircle2 className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleRemoveSlot(slot)}
                        className="rounded-xl border border-red-200 p-2 text-red-600 hover:bg-red-50"
                        aria-label="Remove slot"
                        title="Remove slot"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </main>
    </AuthGuard>
  );
}
