# Patient Appointment Cancellation & Rebooking Feature

Complete implementation of patient appointment cancellation with transactional safety, real-time updates, and audit logging.

## 🎯 Feature Overview

This feature allows patients to:
1. ✅ Cancel eligible appointments (booked/confirmed status)
2. ✅ Receive confirmation dialogs with appointment details
3. ✅ See real-time updates when cancellation completes
4. ✅ Rebook cancelled slots without priority
5. ✅ View audit trails of all cancellations

Key guarantees:
- **Atomic Transactions**: Appointment and slot update together or not at all
- **Real-Time Updates**: All connected clients see changes instantly
- **Audit Logging**: Every cancellation is logged for compliance
- **Concurrent Safety**: Multiple simultaneous cancellations handled correctly

## 📦 Components & Files

### Core Components
- **`MyAppointments.tsx`** - Main appointment management page with cancel UI
- **`CancellationDialog.tsx`** - Confirmation modal for cancellations
- **`ToastContainer.tsx`** - Notification system for user feedback

### Services & Utilities
- **`firestore-schema.ts`** - Type definitions and collection schema
- **`cancellation-service.ts`** - Cloud Function caller with error handling
- **`date-utils.ts`** - Date formatting helpers
- **`toast.ts`** - Toast notification system
- **`useAppointment.ts`** - Custom hook for appointment operations

### Cloud Functions
- **`functions/src/index.ts`** - Firebase Cloud Functions
  - `cancelAppointment()` - Main cancellation with transaction
  - `verifyAppointmentStatus()` - Check if cancellation is allowed
  - `cleanupOldCancelledAppointments()` - Admin cleanup task

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install main app dependencies (if not already done)
npm install

# Install Cloud Functions dependencies
cd functions
npm install
cd ..
```

### 2. Deploy Cloud Functions

```bash
# Deploy to Firebase
firebase deploy --only functions

# Or use emulator for local development
firebase emulators:start --only functions
```

### 3. Deploy Firestore Rules

Copy the rules from `IMPLEMENTATION_GUIDE.md` and deploy:

```bash
firebase deploy --only firestore:rules
```

### 4. Update Your Layout

Add `ToastContainer` to `src/app/layout.tsx`:

```tsx
import ToastContainer from "@/components/ToastContainer";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
```

### 5. Add Appointments Route

Create `src/app/appointments/page.tsx`:

```tsx
import MyAppointments from "@/components/MyAppointments";

export const metadata = {
  title: "My Appointments",
};

export default function AppointmentsPage() {
  return (
    <div className="min-h-screen bg-[#FAFCFB] py-6">
      <div className="mx-auto max-w-4xl px-4">
        <MyAppointments />
      </div>
    </div>
  );
}
```

## 📊 Firestore Collections

### Appointments
```typescript
{
  id: string;
  patientId: string;
  doctorId: string;
  slotId: string;
  status: "booked" | "confirmed" | "cancelled" | "completed" | "no-show";
  cancelledBy?: "patient" | "doctor" | "admin";
  cancelledAt?: ISO_TIMESTAMP;
  // ... other fields
}
```

### Slots
```typescript
{
  id: string;
  doctorId: string;
  status: "available" | "booked" | "unavailable";
  appointmentId?: string;
  // ... other fields
}
```

### Audit Logs
```typescript
{
  action: "appointment_cancelled";
  appointmentId: string;
  patientId: string;
  slotId: string;
  performedBy: "patient";
  timestamp: ISO_TIMESTAMP;
}
```

## 🔄 How It Works

### Cancellation Flow

```
User clicks "Cancel"
        ↓
Confirmation Dialog appears
        ↓
User confirms
        ↓
Cloud Function called with:
  - appointmentId
  - patientId
  - slotId
  - doctorId
        ↓
[FIRESTORE TRANSACTION BEGINS]
  1. Fetch & validate appointment
  2. Verify user is patient
  3. Check status is "booked" or "confirmed"
  4. Verify not already cancelled
  5. Fetch & validate slot
  6. UPDATE appointment → status = "cancelled"
  7. UPDATE slot → status = "available"
  8. CREATE audit log entry
[TRANSACTION COMMITS or ROLLS BACK]
        ↓
Success toast or error message
        ↓
UI updates in real-time via listeners
```

### Real-Time Updates

```typescript
// MyAppointments component subscribes to:
onSnapshot(
  query(collection(db, "appointments"), where("patientId", "==", userId)),
  (snapshot) => {
    // Updates whenever appointments change
    // Other users' cancellations appear instantly
  }
);
```

When a patient cancels:
1. Appointment document updates
2. Firestore notifies all listeners
3. UI re-renders with new status
4. Toast shows success message
5. Cancel button disappears

## 🔒 Security

### Authentication
- All functions require Firebase authentication
- User ID verified against appointment's patientId

### Authorization
- Patients can only cancel their own appointments
- Firestore rules enforce read/write restrictions

### Data Validation
- All required fields validated
- Status checked against allowed cancellations
- Slot verified to match appointment

### Atomic Transactions
- All-or-nothing updates
- No partial states possible
- Concurrent operations handled safely

## 📋 Allowed Cancellations

Appointments can be cancelled if status is:
- ✅ `booked`
- ✅ `confirmed`

Cannot be cancelled if status is:
- ❌ `completed`
- ❌ `cancelled`
- ❌ `no-show`

## 💬 User Notifications

### Success
```
Appointment cancelled successfully. 
The slot is now available for booking.
```

### Error
```
Unable to cancel appointment. Please try again.
```

### Slot Taken (during rebooking)
```
This slot is no longer available. 
Please select another available time.
```

## 🧪 Testing

### Test Cancellation
1. Navigate to `/appointments`
2. Find an eligible appointment
3. Click "Cancel"
4. Review details in confirmation dialog
5. Click "Cancel Appointment"
6. Should see success toast
7. Appointment status should change
8. Cancel button should disappear

### Test Real-Time Updates
1. Open appointments page in two browser windows
2. Cancel from one window
3. Other window should update automatically
4. No page refresh needed

### Test Rebooking
1. After cancellation, go to booking page
2. Previous slot should appear as available
3. Should be able to book without priority
4. Another patient can also book it

### Test Audit Logging
1. Cancel an appointment
2. Check Firestore `auditLogs` collection
3. Should have entry with:
   - `action: "appointment_cancelled"`
   - `appointmentId` matching cancelled appointment
   - `performedBy: "patient"`
   - Current timestamp

## 🛠️ Troubleshooting

### Toast not appearing?
- Check `ToastContainer` is in layout.tsx
- Verify `subscribeToToasts` is being called

### Cancellation fails?
- Check Cloud Functions are deployed
- Verify user is authenticated
- Check Firestore rules are correct
- Review Cloud Functions logs: `firebase functions:log`

### Real-time updates not working?
- Verify Firestore listener in MyAppointments
- Check browser console for errors
- Ensure user has read permission on appointments

### "Permission denied" error?
- Deploy Firestore rules from IMPLEMENTATION_GUIDE.md
- Check Cloud Functions service account has permissions

## 📝 API Reference

### `cancelAppointment(appointment, patientId)`
**Parameters:**
- `appointment: Appointment` - The appointment to cancel
- `patientId: string` - Firebase UID of patient

**Returns:** `Promise<CancellationResponse>`
```typescript
{
  success: boolean;
  message: string;
  appointmentId: string;
  slotId: string;
}
```

**Throws:** Error with descriptive message

### `useAppointment()`
**Returns:**
```typescript
{
  cancelling: string | null;  // ID being cancelled or null
  error: string | null;       // Error message if failed
  handleCancel: (appointment, patientId) => Promise<boolean>
}
```

### Toast Functions
```typescript
import { toast } from "@/lib/toast";

toast.success("Message"); // Green, 4s duration
toast.error("Message");   // Red, 5s duration
toast.info("Message");    // Blue, 4s duration
toast.warning("Message"); // Yellow, 4s duration
```

## 📚 Additional Resources

- See `IMPLEMENTATION_GUIDE.md` for detailed setup and deployment
- Check `functions/src/index.ts` for Cloud Function source code
- Review `src/components/MyAppointments.tsx` for UI implementation
- Firestore rules in `IMPLEMENTATION_GUIDE.md`

## 🎓 Architecture Decisions

### Why Firestore Transactions?
- Ensures atomic updates (appointment + slot together)
- Prevents race conditions
- Automatic rollback on failure
- No manual compensation logic needed

### Why Real-Time Listeners?
- Instant updates across all users
- No polling or manual refresh needed
- Scales efficiently with Firestore subscriptions
- Better user experience

### Why Cloud Functions?
- Server-side validation prevents cheating
- Complex business logic in one place
- Audit logging centralized
- Better security (rules + functions)

### Why Toast Notifications?
- Non-intrusive feedback
- Works across any page
- Accessible to all users
- Standard UI pattern

## 🔮 Future Enhancements

### Planned Features
- [ ] Email notifications on cancellation
- [ ] SMS reminders before appointments
- [ ] Cancellation reason tracking
- [ ] Automatic rebooking suggestions
- [ ] Doctor approval for cancellations
- [ ] Bulk cancellation by admin

### Analytics
- [ ] Cancellation rate by time of day
- [ ] Popular vs. unpopular time slots
- [ ] Patient cancellation patterns
- [ ] No-show prediction

### Integrations
- [ ] Calendar sync (Google Calendar, Outlook)
- [ ] Slack notifications
- [ ] Payment refunds on cancellation
- [ ] Waiting list management

---

**Created:** 2024
**Version:** 1.0.0
**Status:** Production Ready
