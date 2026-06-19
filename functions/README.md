# Doctor Dashboard

## Overview

This repository is a Next.js application scaffolded with the App Router and TypeScript. It is intended as a doctor appointment dashboard with support for appointment slots, patient records, notes, notifications, and authentication integration via Firebase and Supabase.

## What is implemented

- **Next.js app structure** using `src/app` with `layout.tsx` and `page.tsx`.
- **Reusable slot UI component** in `src/components/SlotCard.tsx` for rendering appointment slots with availability and booked states.
- **Supabase client setup** in `src/lib/supabaseClient.ts` using environment variables.
- **Firebase setup** in `src/lib/firebase.ts` for authentication and Firestore access.
- **Database schema** in `supabase/schema.sql` defining:
  - `slots` table for appointment time slots
  - `patients` table for booked patient appointments
  - `notes` table for patient-related notes
  - `notifications` table for active alerts
  - row-level security policies for public read access and authenticated admin access
  - realtime publication for the `slots` table

## File summary

- `package.json`
  - Next.js 16
  - React 19
  - Tailwind CSS 4
  - Supabase and Firebase dependencies
- `next.config.ts`
  - Default Next.js configuration placeholder
- `tsconfig.json`
  - TypeScript settings with `@/*` path alias for `src/*`
- `src/app/layout.tsx`
  - Defines app metadata and app-level fonts
- `src/app/page.tsx`
  - Currently contains the default Create Next App starter page
- `src/components/SlotCard.tsx`
  - A presentational button component for appointment slots
  - Displays available/booked state and supports click handling
- `src/lib/supabaseClient.ts`
  - Creates and exports a Supabase client instance
- `src/lib/firebase.ts`
  - Initializes Firebase app and exports `auth` and `db`
- `supabase/schema.sql`
  - SQL schema and security policies for a doctor appointment backend

## Environment variables

The app expects the following environment variables to be set for Supabase and Firebase integration:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

## How to run

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

## Notes

- The current `page.tsx` is still the default starter screen and has not yet been replaced with the dashboard UI.
- The main custom implementation so far is the slot card component and backend client boilerplate.
- `supabase/schema.sql` is ready to create the database tables and policies for a production-friendly appointment system.

## Next steps

To complete the dashboard, you may want to:

- build the appointment booking page UI
- connect `SlotCard` to Supabase dataa
- add authentication flows with Firebase
- implement booking creation and patient management
- add notifications and notes management
