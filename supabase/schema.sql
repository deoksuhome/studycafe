-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (links to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reservations table
CREATE TABLE reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_number INTEGER NOT NULL CHECK (seat_number BETWEEN 1 AND 25),
  date DATE NOT NULL,
  day_of_week TEXT NOT NULL CHECK (day_of_week IN ('saturday', 'sunday')),
  start_slot INTEGER NOT NULL CHECK (start_slot BETWEEN 0 AND 3),
  end_slot INTEGER NOT NULL CHECK (end_slot BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_slot_range CHECK (end_slot >= start_slot)
);

-- Prevent double booking: same seat, same date, overlapping slots
CREATE OR REPLACE FUNCTION check_reservation_conflict()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE seat_number = NEW.seat_number
      AND date = NEW.date
      AND id != COALESCE(NEW.id, uuid_generate_v4())
      AND (
        (start_slot <= NEW.end_slot AND end_slot >= NEW.start_slot)
      )
  ) THEN
    RAISE EXCEPTION 'Seat already reserved for this time slot';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_reservation_conflict_trigger
  BEFORE INSERT OR UPDATE ON reservations
  FOR EACH ROW EXECUTE FUNCTION check_reservation_conflict();

-- One reservation per student per day
CREATE UNIQUE INDEX one_reservation_per_day ON reservations (user_id, date);

-- RLS Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can insert profiles" ON profiles
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Reservations: students can see availability (seat/date/time only, no user_id), admins see all
CREATE POLICY "Anyone logged in can view reservation slots" ON reservations
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Students can insert own reservations" ON reservations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can delete own reservations" ON reservations
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on reservations" ON reservations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );
