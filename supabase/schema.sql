-- Doctor Appointment Dashboard Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM for slot status
CREATE TYPE slot_status AS ENUM ('available', 'booked', 'unavailable');

-- 1. Slots Table
CREATE TABLE slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    time TEXT NOT NULL,
    status slot_status NOT NULL DEFAULT 'available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add a unique constraint to prevent duplicate slots
ALTER TABLE slots ADD CONSTRAINT unique_date_time UNIQUE (date, time);

-- 2. Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    slot_id UUID REFERENCES slots(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Notes Table
CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message TEXT NOT NULL,
    date DATE,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Security Policies
-- ----------------------------------------------------

-- Everyone can read slots
CREATE POLICY "Public read access to slots" 
ON slots FOR SELECT 
TO public 
USING (true);

-- Only authenticated users (Admin) can insert/update/delete slots
CREATE POLICY "Admin full access to slots" 
ON slots FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Everyone can insert a patient (for webhook/booking)
-- In a real production environment, you might restrict this to a specific service role or the webhook origin.
CREATE POLICY "Public insert access to patients" 
ON patients FOR INSERT 
TO public 
WITH CHECK (true);

-- Only Admin can read, update, delete patients
CREATE POLICY "Admin full access to patients" 
ON patients FOR SELECT, UPDATE, DELETE 
TO authenticated 
USING (true);

-- Only Admin can access notes
CREATE POLICY "Admin full access to notes" 
ON notes FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Everyone can read active notifications
CREATE POLICY "Public read active notifications" 
ON notifications FOR SELECT 
TO public 
USING (active = true);

-- Only Admin can manage notifications
CREATE POLICY "Admin full access to notifications" 
ON notifications FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);

-- Enable Realtime for slots table
alter publication supabase_realtime add table slots;
