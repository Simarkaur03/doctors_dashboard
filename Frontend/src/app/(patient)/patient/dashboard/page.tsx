"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronRight, ClipboardList, Megaphone, User } from "lucide-react";
import { useAuth } from "../../../auth/AuthContext";
import { fetchNextAppointment, fetchUserProfile, PatientAppointment, PatientProfile } from "../../../lib/patient";
import { formatDate } from "../../../lib/date-utils";

export default function PatientDashboardPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [appointment, setAppointment] = useState<PatientAppointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileData, nextAppointment] = await Promise.all([
          fetchUserProfile(user.uid),
          fetchNextAppointment(user.uid),
        ]);
        setProfile(profileData);
        setAppointment(nextAppointment);
      } catch (err) {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const greetingName = profile?.name || user?.displayName || "there";

  return (
    <div className="space-y-8">
      <div className="rounded-[32px] bg-white p-8 shadow-sm shadow-slate-200/50">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sage">Welcome back</p>
            <h1 className="mt-3 text-3xl font-semibold text-slate-900">{greetingName}</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600">
              Here is your next appointment and a few helpful actions to keep things easy.
            </p>
          </div>
          <Link
            href="/book"
            className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-sage px-5 text-base font-semibold text-white shadow-sm transition hover:bg-sage-dark"
          >
            Book an Appointment
          </Link>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sage">Next appointment</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Your next visit</h2>
          </div>
          <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">
            {appointment ? "Coming soon" : "No appointments yet"}
          </div>
        </div>

        {loading ? (
          <div className="space-y-4 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="h-8 w-3/5 animate-pulse rounded-full bg-slate-200" />
            <div className="space-y-3">
              <div className="h-5 w-full animate-pulse rounded-full bg-slate-200" />
              <div className="h-5 w-5/6 animate-pulse rounded-full bg-slate-200" />
            </div>
          </div>
        ) : error ? (
          <div className="rounded-[32px] border border-red-100 bg-red-50 p-6 text-sm text-red-700">
            Something went wrong. Please try again.
          </div>
        ) : appointment ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-3">
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sage">{formatDate(appointment.date)} • {appointment.time}</p>
                <h3 className="text-2xl font-semibold text-slate-900">{appointment.doctorName}</h3>
                <p className="max-w-xl text-sm text-slate-600">We will meet with you at the scheduled time. If anything changes, you can manage it from your appointments page.</p>
              </div>
              <div className="rounded-3xl bg-sage-light px-5 py-4 text-sm text-slate-900">
                <p className="font-semibold text-slate-900">Status</p>
                <p className="mt-2 text-lg font-semibold text-sage">{appointment.status === "confirmed" ? "Confirmed" : "Pending"}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-[32px] border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-sage">No upcoming appointments</p>
            <p className="mt-4 text-lg font-semibold text-slate-900">You have no booked visits yet.</p>
            <p className="mt-2 text-sm text-slate-600">When you book your first appointment, it will appear here.</p>
            <Link
              href="/book"
              className="mt-6 inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-sage px-5 text-base font-semibold text-white shadow-sm transition hover:bg-sage-dark"
            >
              Book your first appointment
            </Link>
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/my-appointments"
          className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-light text-sage">
            <ClipboardList className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">My appointments</h3>
          <p className="mt-2 text-sm text-slate-600">View your upcoming and past visits.</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-sage">
            View appointments <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/notifications"
          className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-light text-sage">
            <Megaphone className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">Notifications</h3>
          <p className="mt-2 text-sm text-slate-600">Check messages from your clinic.</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-sage">
            View notifications <ChevronRight className="h-4 w-4" />
          </div>
        </Link>

        <Link
          href="/profile"
          className="rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:shadow-md"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage-light text-sage">
            <User className="h-6 w-6" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-slate-900">Profile</h3>
          <p className="mt-2 text-sm text-slate-600">Keep your contact details up to date.</p>
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-sage">
            View profile <ChevronRight className="h-4 w-4" />
          </div>
        </Link>
      </section>
    </div>
  );
}
