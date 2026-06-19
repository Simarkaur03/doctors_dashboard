"use client";
import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle, Clock, Plus, User, X } from "lucide-react";

const today = new Date();
const todayISO = today.toISOString().slice(0, 10);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowISO = tomorrow.toISOString().slice(0, 10);

const initialSlots = [
  { id: 1, date: todayISO, time: "09:15", duration: 30, status: "booked", patientName: "Sara Patel" },
  { id: 2, date: todayISO, time: "10:00", duration: 15, status: "available" },
  { id: 3, date: todayISO, time: "11:30", duration: 45, status: "booked", patientName: "Rahul Mehta" },
  { id: 4, date: tomorrowISO, time: "08:45", duration: 60, status: "available" },
  { id: 5, date: tomorrowISO, time: "13:00", duration: 30, status: "cancelled" },
  { id: 6, date: tomorrowISO, time: "15:30", duration: 30, status: "available" },
];

const formatFullDate = (dateString) => {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(dateString));
};

const formatDateLabel = (dateString) => {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
  }).format(new Date(dateString));
};

const sortByDateTime = (slots) => {
  return [...slots].sort((a, b) => {
    const aDate = new Date(`${a.date}T${a.time}`);
    const bDate = new Date(`${b.date}T${b.time}`);
    return aDate - bDate;
  });
};

const roleButtonStyle = (active) => ({
  backgroundColor: active ? "#6F8F7A" : "transparent",
  color: active ? "#FFFFFF" : "#66736D",
});

export default function App() {
  const [activeRole, setActiveRole] = useState("doctor");
  const [slots, setSlots] = useState(initialSlots);
  const [confirmationSlot, setConfirmationSlot] = useState(null);
  const [slotDate, setSlotDate] = useState(todayISO);
  const [slotTime, setSlotTime] = useState("09:00");
  const [slotDuration, setSlotDuration] = useState("30");
  const [showToast, setShowToast] = useState(false);
  const [activeTab, setActiveTab] = useState("All");
  const [bookingSlot, setBookingSlot] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [bookingError, setBookingError] = useState("");
  const [confirmScale, setConfirmScale] = useState(false);

  useEffect(() => {
    if (confirmationSlot) {
      const id = window.setTimeout(() => setConfirmScale(true), 20);
      return () => window.clearTimeout(id);
    }
    setConfirmScale(false);
  }, [confirmationSlot]);

  const todayAppointments = useMemo(
    () => slots.filter((slot) => slot.date === todayISO && slot.status === "booked"),
    [slots]
  );

  const availableCount = useMemo(
    () => slots.filter((slot) => slot.status === "available").length,
    [slots]
  );

  const bookedCount = useMemo(
    () => slots.filter((slot) => slot.status === "booked").length,
    [slots]
  );

  const cancelledCount = useMemo(
    () => slots.filter((slot) => slot.status === "cancelled").length,
    [slots]
  );

  const filteredSlots = useMemo(() => {
    let list = slots;
    if (activeTab === "Available") list = slots.filter((slot) => slot.status === "available");
    if (activeTab === "Booked") list = slots.filter((slot) => slot.status === "booked");
    if (activeTab === "Cancelled") list = slots.filter((slot) => slot.status === "cancelled");
    return sortByDateTime(list);
  }, [activeTab, slots]);

  const availableSlots = useMemo(
    () => sortByDateTime(slots.filter((slot) => slot.status === "available")),
    [slots]
  );

  const addSlot = () => {
    if (!slotDate || !slotTime) return;
    const newSlot = {
      id: Date.now(),
      date: slotDate,
      time: slotTime,
      duration: Number(slotDuration),
      status: "available",
    };
    setSlots((current) => [...current, newSlot]);
    setShowToast(true);
    window.setTimeout(() => setShowToast(false), 2000);
  };

  const cancelSlot = (id) => {
    setSlots((current) =>
      current.map((slot) => (slot.id === id ? { ...slot, status: "cancelled" } : slot))
    );
  };

  const openBooking = (slot) => {
    setBookingSlot(slot);
    setPatientName("");
    setBookingError("");
  };

  const confirmBooking = () => {
    if (!patientName.trim()) {
      setBookingError("Please enter your name to continue.");
      return;
    }

    setSlots((current) =>
      current.map((slot) =>
        slot.id === bookingSlot.id
          ? { ...slot, status: "booked", patientName: patientName.trim() }
          : slot
      )
    );
    setConfirmationSlot({ ...bookingSlot, patientName: patientName.trim() });
    setBookingSlot(null);
    setPatientName("");
    setBookingError("");
  };

  const resetConfirmation = () => {
    setConfirmationSlot(null);
  };

  const headerDate = formatFullDate(todayISO);

  const renderDoctorView = () => (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-[#F7F9F8] p-5 border border-[#DDE8E1] shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 text-xs font-semibold text-[#93A19A] uppercase tracking-wider">
            <Calendar className="h-5 w-5 text-[#6F8F7A]" />
            Today's Appointments
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#24302A]">{todayAppointments.length}</p>
        </div>
        <div className="rounded-2xl bg-[#F7F9F8] p-5 border border-[#DDE8E1] shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 text-xs font-semibold text-[#93A19A] uppercase tracking-wider">
            <Clock className="h-5 w-5 text-[#7BAA88]" />
            Available Slots
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#24302A]">{availableCount}</p>
        </div>
        <div className="rounded-2xl bg-[#F7F9F8] p-5 border border-[#DDE8E1] shadow-sm transition-shadow duration-200 hover:shadow-md">
          <div className="flex items-center gap-3 text-xs font-semibold text-[#93A19A] uppercase tracking-wider">
            <CheckCircle className="h-5 w-5 text-[#D8A75C]" />
            Booked Slots
          </div>
          <p className="mt-4 text-3xl font-semibold text-[#24302A]">{bookedCount}</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[#24302A]">Today's Appointments</h2>
              <p className="text-sm text-[#66736D]">Review today's confirmed bookings</p>
            </div>
          </div>
          <div className="space-y-3">
            {todayAppointments.length === 0 ? (
              <div className="rounded-2xl border border-[#DDE8E1] bg-white p-10 text-center text-[#93A19A] shadow-sm">
                <Calendar className="mx-auto h-12 w-12 text-[#DDE8E1]" />
                <p className="mt-3 text-sm">No appointments booked for today yet</p>
              </div>
            ) : (
              todayAppointments.map((slot) => (
                <div
                  key={slot.id}
                  className="grid gap-4 rounded-2xl border border-[#DDE8E1] bg-white p-4 shadow-sm sm:grid-cols-[auto_1fr_auto]"
                >
                  <div className="rounded-md bg-[#EEF4F0] px-3 py-1 text-sm font-semibold text-[#4F6B5A]">
                    {slot.time}
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-[#24302A]">{slot.patientName}</p>
                    <span className="inline-flex items-center rounded-full border border-[#DDE8E1] bg-[#F7F9F8] px-3 py-1 text-sm text-[#93A19A]">
                      {slot.duration} min
                    </span>
                  </div>
                  <div className="flex items-center justify-end">
                    <span className="rounded-full bg-[#EBF3ED] px-3 py-1 text-sm font-semibold text-[#7BAA88]">
                      Confirmed
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 border border-[#DDE8E1] shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-[#6F8F7A]">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#24302A]">Create Available Slot</h3>
              <p className="text-sm text-[#66736D]">Add a new time slot for patients to book.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 rounded-xl bg-[#EEF4F0] p-4 sm:flex-row sm:items-center">
            <div className="flex-1 min-w-0">
              <label className="mb-2 block text-sm font-medium text-[#66736D]">Date</label>
              <input
                type="date"
                className="w-full rounded-lg border border-[#DDE8E1] bg-[#F7F9F8] px-3 py-2 text-sm text-[#24302A] outline-none ring-0 transition duration-150 focus:ring-2 focus:ring-[#6F8F7A]/30"
                value={slotDate}
                onChange={(event) => setSlotDate(event.target.value)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="mb-2 block text-sm font-medium text-[#66736D]">Time</label>
              <input
                type="time"
                className="w-full rounded-lg border border-[#DDE8E1] bg-[#F7F9F8] px-3 py-2 text-sm text-[#24302A] outline-none ring-0 transition duration-150 focus:ring-2 focus:ring-[#6F8F7A]/30"
                value={slotTime}
                onChange={(event) => setSlotTime(event.target.value)}
              />
            </div>
            <div className="flex-1 min-w-0">
              <label className="mb-2 block text-sm font-medium text-[#66736D]">Duration</label>
              <select
                className="w-full rounded-lg border border-[#DDE8E1] bg-[#F7F9F8] px-3 py-2 text-sm text-[#24302A] outline-none ring-0 transition duration-150 focus:ring-2 focus:ring-[#6F8F7A]/30"
                value={slotDuration}
                onChange={(event) => setSlotDuration(event.target.value)}
              >
                <option value="15">15 min</option>
                <option value="30">30 min</option>
                <option value="45">45 min</option>
                <option value="60">60 min</option>
              </select>
            </div>
            <div className="flex-shrink-0">
              <button
                type="button"
                onClick={addSlot}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-150"
                style={{ backgroundColor: "#6F8F7A" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4F6B5A")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6F8F7A")}
              >
                <Plus className="h-4 w-4" />
                Add Slot
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 border border-[#DDE8E1] shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-[#6F8F7A]">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#24302A]">All Slots</h3>
              <p className="text-sm text-[#66736D]">Manage every appointment and availability slot.</p>
            </div>
            <div className="flex flex-wrap gap-6">
              {['All', 'Available', 'Booked', 'Cancelled'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-medium transition duration-150 pb-2 ${activeTab === tab ? 'text-[#24302A]' : 'text-[#93A19A]'}`}
                  style={activeTab === tab ? { borderBottom: '2px solid #6F8F7A' } : { borderBottom: '2px solid transparent' }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {filteredSlots.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#DDE8E1] bg-[#FAFCFB] p-10 text-center text-[#93A19A]">
                No slots match this filter.
              </div>
            ) : (
              filteredSlots.map((slot) => {
                const isCancelled = slot.status === "cancelled";
                const chipStyle = {
                  available: { backgroundColor: "#EEF4F0", color: "#6F8F7A" },
                  booked: { backgroundColor: "#EBF3ED", color: "#7BAA88" },
                  cancelled: { backgroundColor: "#F7EDEC", color: "#C97B7B" },
                };
                return (
                  <div
                    key={slot.id}
                    className="grid gap-4 rounded-2xl border border-[#DDE8E1] bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto] sm:items-center"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-sm text-[#66736D]">
                        <span>{formatFullDate(slot.date)}</span>
                        <span>•</span>
                        <span>{slot.time}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full bg-[#F7F9F8] px-3 py-1 text-xs font-medium text-[#93A19A]`}>
                          {slot.duration} min
                        </span>
                        <span
                          className="rounded-full px-3 py-1 text-xs font-semibold"
                          style={chipStyle[slot.status]}
                        >
                          {slot.status === "available" ? "Available" : slot.status === "booked" ? "Booked" : "Cancelled"}
                        </span>
                      </div>
                      {slot.patientName && !isCancelled ? (
                        <p className="text-sm text-[#66736D]">Patient: {slot.patientName}</p>
                      ) : null}
                      {isCancelled ? (
                        <p className="text-sm font-medium text-[#93A19A] line-through">This slot was cancelled.</p>
                      ) : null}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      {slot.status !== "cancelled" ? (
                        <button
                          type="button"
                          onClick={() => cancelSlot(slot.id)}
                          className="rounded-lg border border-[#C97B7B] px-3 py-2 text-xs font-semibold text-[#C97B7B] transition duration-150 hover:bg-[#F7EDEC]"
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderPatientView = () => {
    if (confirmationSlot) {
      return (
        <div className="space-y-8">
          <div className="rounded-2xl bg-white p-8 border border-[#DDE8E1] shadow-sm text-center">
            <div
              className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full"
              style={{ backgroundColor: "#EBF3ED", transform: confirmScale ? "scale(1)" : "scale(0)", transition: "transform 300ms ease-out" }}
            >
              <CheckCircle className="h-12 w-12 text-[#7BAA88]" />
            </div>
            <h2 className="text-2xl font-semibold text-[#24302A]">Appointment confirmed</h2>
            <p className="mt-2 text-sm text-[#66736D]">Your appointment has been booked successfully.</p>
          </div>

          <div className="rounded-2xl bg-[#EBF3ED] p-6 border border-[#DDE8E1] shadow-sm">
            <div className="space-y-3 text-sm text-[#24302A]">
              <p className="text-base font-semibold">Patient: {confirmationSlot.patientName}</p>
              <p>Doctor: Dr. Ananya Sharma</p>
              <p>Date: {formatFullDate(confirmationSlot.date)}</p>
              <p>Time: {confirmationSlot.time}</p>
              <p>Duration: {confirmationSlot.duration} minutes</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={resetConfirmation}
              className="rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors duration-150"
              style={{ backgroundColor: "#6F8F7A" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4F6B5A")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6F8F7A")}
            >
              Book Another Appointment
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("doctor")}
              className="rounded-lg border border-[#DDE8E1] bg-white px-5 py-2 text-sm font-semibold text-[#24302A] transition duration-150 hover:bg-[#FAFCFB]"
            >
              Switch to Doctor View
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="space-y-3 rounded-xl bg-[#EEF4F0] border-l-4 border-[#6F8F7A] p-5 shadow-sm sm:flex sm:items-center sm:justify-between sm:gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#6F8F7A]">
              <User className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-semibold text-[#24302A]">Dr. Ananya Sharma</p>
              <p className="text-sm text-[#66736D]">General Physician</p>
            </div>
          </div>
          <p className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-[#24302A] shadow-sm">
            ⭐ 4.9 · 200+ patients
          </p>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl bg-white p-6 border border-[#DDE8E1] shadow-sm">
            <h2 className="text-xl font-semibold text-[#24302A]">Book an Appointment</h2>
            <p className="mt-2 text-sm text-[#66736D]">
              with Dr. Ananya Sharma · General Physician
            </p>
          </div>

          {availableSlots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#DDE8E1] bg-white p-10 text-center text-[#93A19A] shadow-sm">
              No slots available right now. Check back soon.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {availableSlots.map((slot) => (
                <div
                  key={slot.id}
                  className="group rounded-2xl border border-[#DDE8E1] bg-white p-6 shadow-sm transition duration-200 hover:border-[#6F8F7A] hover:shadow-md"
                >
                  <div className="text-xs font-semibold text-[#93A19A] uppercase tracking-wider">{formatDateLabel(slot.date)}</div>
                  <div className="mt-3 inline-flex rounded-md bg-[#EEF4F0] px-3 py-1 text-sm font-semibold text-[#4F6B5A]">
                    {slot.time}
                  </div>
                  <p className="mt-4 text-base font-semibold text-[#24302A]">{slot.duration} minute session</p>
                  <button
                    type="button"
                    onClick={() => openBooking(slot)}
                    className="mt-6 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-150"
                    style={{ backgroundColor: "#6F8F7A" }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4F6B5A")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6F8F7A")}
                  >
                    Book Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFCFB] py-6 text-[#24302A] font-sans">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
<div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-6 border border-[#DDE8E1] shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#6F8F7A]/10 text-[#6F8F7A] text-lg font-semibold">
            Dr. A
          </div>
          <div>
            <p className="text-base font-semibold text-[#24302A]">Dr. Ananya Sharma</p>
            <p className="text-sm text-[#66736D]">General Physician</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <div className="flex items-center gap-2 rounded-full bg-[#EEF4F0] px-4 py-2 text-sm font-semibold text-[#6F8F7A]">
            <Calendar className="h-4 w-4" />
            {headerDate}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#6F8F7A] px-4 py-2 text-sm font-semibold text-white">
              <span>{todayAppointments.length}</span>
              <span>today's appointments</span>
            </div>
          </div>
        </div>

        <div className="mb-6 flex justify-end">
          <div className="inline-flex rounded-full bg-[#EEF4F0] p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setActiveRole("doctor")}
              className="rounded-full px-4 py-2 text-sm font-semibold transition duration-150"
              style={roleButtonStyle(activeRole === "doctor")}
            >
              Doctor View
            </button>
            <button
              type="button"
              onClick={() => setActiveRole("patient")}
              className="rounded-full px-4 py-2 text-sm font-semibold transition duration-150"
              style={roleButtonStyle(activeRole === "patient")}
            >
              Patient View
            </button>
          </div>
        </div>

        {activeRole === "doctor" ? renderDoctorView() : renderPatientView()}
      </div>

      {bookingSlot ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(36, 48, 42, 0.45)" }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-7 shadow-xl border border-[#DDE8E1]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-[#93A19A] uppercase tracking-wider">Confirm Booking</p>
                <h3 className="text-base font-semibold text-[#24302A]">Review appointment details</h3>
              </div>
              <button
                type="button"
                onClick={() => setBookingSlot(null)}
                className="rounded-full p-2 text-[#93A19A] transition hover:bg-[#FAFCFB]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 rounded-xl bg-[#EEF4F0] p-4">
              <p className="text-xs font-semibold text-[#93A19A] uppercase tracking-wider">Date</p>
              <p className="text-sm font-semibold text-[#24302A]">{formatFullDate(bookingSlot.date)}</p>
              <p className="text-xs font-semibold text-[#93A19A] uppercase tracking-wider">Time</p>
              <p className="text-sm font-semibold text-[#24302A]">{bookingSlot.time}</p>
              <p className="text-xs font-semibold text-[#93A19A] uppercase tracking-wider">Duration</p>
              <p className="text-sm font-semibold text-[#24302A]">{bookingSlot.duration} minutes</p>
            </div>
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium text-[#66736D]">Patient Name</label>
              <input
                type="text"
                className="w-full rounded-lg border border-[#DDE8E1] bg-[#F7F9F8] px-3 py-2 text-sm text-[#24302A] outline-none ring-0 transition duration-150 focus:ring-2 focus:ring-[#6F8F7A]/30"
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                placeholder="Enter your name"
              />
              {bookingError ? <p className="text-sm text-[#C97B7B]">{bookingError}</p> : null}
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setBookingSlot(null)}
                className="rounded-lg border border-[#DDE8E1] bg-white px-4 py-2 text-sm font-semibold text-[#24302A] transition duration-150 hover:bg-[#FAFCFB]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmBooking}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors duration-150"
                style={{ backgroundColor: "#6F8F7A" }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#4F6B5A")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#6F8F7A")}
              >
                Confirm Booking
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showToast ? (
        <div className="fixed bottom-6 right-6 z-50 rounded-2xl bg-[#4F6B5A] px-4 py-3 text-sm font-semibold text-white shadow-lg transition-opacity duration-300" style={{ boxShadow: "0 4px 12px rgba(79,107,90,0.20)" }}>
          Slot added successfully
        </div>
      ) : null}
    </div>
  );
}
