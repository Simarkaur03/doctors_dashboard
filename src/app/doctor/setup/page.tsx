"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { Loader2 } from "lucide-react";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../auth/AuthContext";
import { AuthGuard } from "../../../components/providers/AuthGuard";
import { Card } from "../../../components/ui/Card";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { toast } from "../../../lib/toast";
import { WEEKDAYS, saveRecurringAvailability } from "../../../lib/availability-service";

export default function DoctorSetupPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [weekdaysOnly, setWeekdaysOnly] = useState(true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user?.uid) return;
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        specialty: specialty.trim(),
        setupComplete: true,
      });

      const enabledDays = weekdaysOnly ? WEEKDAYS.slice(0, 5) : WEEKDAYS;
      await Promise.all(
        WEEKDAYS.map((day) =>
          saveRecurringAvailability({
            doctorId: user.uid,
            day,
            enabled: enabledDays.includes(day),
            startTime,
            endTime,
            slotDuration: 30,
          })
        )
      );

      toast.success("Setup complete. Welcome aboard!");
      router.replace("/doctor/dashboard");
    } catch {
      toast.error("Could not save your setup. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthGuard requiredRole="doctor">
    <main className="min-h-screen bg-[#FFF3D5] p-4 md:p-6">
      <div className="mx-auto max-w-xl">
        <Card>
          <h1 className="text-xl font-semibold text-slate-900">Doctor Setup</h1>

          <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
            <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} required />
            <Input
              label="Specialty (optional)"
              value={specialty}
              onChange={(event) => setSpecialty(event.target.value)}
              placeholder="e.g. Family Medicine"
            />

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">Standard hours</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <span className="text-sm text-slate-500">to</span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-600">
                <input type="checkbox" checked={weekdaysOnly} onChange={(event) => setWeekdaysOnly(event.target.checked)} />
                Weekdays only (Mon–Fri)
              </label>
            </div>

            <Button type="submit" className="w-full" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {saving ? "Saving" : "Finish setup"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
    </AuthGuard>
  );
}
