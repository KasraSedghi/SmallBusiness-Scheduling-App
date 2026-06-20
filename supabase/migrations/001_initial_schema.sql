-- Red Bean Scheduler: Initial Database Schema & Row-Level Security
-- Created: 2026-06-20
-- Timezone: America/New_York (hardcoded for all date operations)

-- ============================================================================
-- 1. PROFILES TABLE (Links to auth.users, stores employee/admin metadata)
-- ============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick role lookups
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);

-- ============================================================================
-- 2. AVAILABILITIES TABLE (Employee shift preferences for each week)
-- ============================================================================
CREATE TABLE availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  week_starting DATE NOT NULL,
  shift_data JSONB NOT NULL DEFAULT '{
    "monday": { "morning": false, "afternoon": false, "evening": false },
    "tuesday": { "morning": false, "afternoon": false, "evening": false },
    "wednesday": { "morning": false, "afternoon": false, "evening": false },
    "thursday": { "morning": false, "afternoon": false, "evening": false },
    "friday": { "morning": false, "afternoon": false, "evening": false },
    "saturday": { "morning": false, "afternoon": false, "evening": false },
    "sunday": { "morning": false, "afternoon": false, "evening": false }
  }',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(profile_id, week_starting)
);

-- Indexes for efficient queries
CREATE INDEX idx_availabilities_profile_id ON availabilities(profile_id);
CREATE INDEX idx_availabilities_week_starting ON availabilities(week_starting);
CREATE INDEX idx_availabilities_status ON availabilities(status);
CREATE INDEX idx_availabilities_profile_week ON availabilities(profile_id, week_starting);

-- ============================================================================
-- 3. TIME_OFF_REQUESTS TABLE (Employee vacation/absence requests)
-- ============================================================================
CREATE TABLE time_off_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Indexes for efficient queries
CREATE INDEX idx_time_off_requests_profile_id ON time_off_requests(profile_id);
CREATE INDEX idx_time_off_requests_status ON time_off_requests(status);
CREATE INDEX idx_time_off_requests_date_range ON time_off_requests(start_date, end_date);

-- ============================================================================
-- 4. CAPACITY_SETTINGS TABLE (Weekly shift capacity rules and holiday overrides)
-- ============================================================================
CREATE TABLE capacity_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_starting DATE NOT NULL UNIQUE,
  rules JSONB NOT NULL DEFAULT '{
    "capacity": {
      "monday": { "morning": 0, "afternoon": 0, "evening": 0 },
      "tuesday": { "morning": 0, "afternoon": 0, "evening": 0 },
      "wednesday": { "morning": 0, "afternoon": 0, "evening": 0 },
      "thursday": { "morning": 0, "afternoon": 0, "evening": 0 },
      "friday": { "morning": 0, "afternoon": 0, "evening": 0 },
      "saturday": { "morning": 0, "afternoon": 0, "evening": 0 },
      "sunday": { "morning": 0, "afternoon": 0, "evening": 0 }
    },
    "holiday_overrides": {}
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for efficient week lookups
CREATE INDEX idx_capacity_settings_week_starting ON capacity_settings(week_starting);

-- ============================================================================
-- 5. ENABLE ROW-LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE capacity_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. ROW-LEVEL SECURITY POLICIES: PROFILES
-- ============================================================================

-- Employees can read only their own profile
CREATE POLICY "employees_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Employees can update only their own profile (except role)
CREATE POLICY "employees_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Admins can read all profiles
CREATE POLICY "admins_read_all_profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all profiles
CREATE POLICY "admins_update_all_profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Users can insert their own profile (during signup)
CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 7. ROW-LEVEL SECURITY POLICIES: AVAILABILITIES
-- ============================================================================

-- Employees can read only their own availabilities
CREATE POLICY "employees_read_own_availabilities"
  ON availabilities FOR SELECT
  USING (
    auth.uid() = profile_id
  );

-- Employees can insert their own availabilities
CREATE POLICY "employees_insert_own_availabilities"
  ON availabilities FOR INSERT
  WITH CHECK (
    auth.uid() = profile_id
  );

-- Employees can update only their own availabilities (only if status is still 'pending')
CREATE POLICY "employees_update_own_availabilities"
  ON availabilities FOR UPDATE
  USING (
    auth.uid() = profile_id AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = profile_id AND status = 'pending'
  );

-- Admins can read all availabilities
CREATE POLICY "admins_read_all_availabilities"
  ON availabilities FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all availabilities (for approval/rejection)
CREATE POLICY "admins_update_all_availabilities"
  ON availabilities FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 8. ROW-LEVEL SECURITY POLICIES: TIME_OFF_REQUESTS
-- ============================================================================

-- Employees can read only their own time-off requests
CREATE POLICY "employees_read_own_time_off_requests"
  ON time_off_requests FOR SELECT
  USING (
    auth.uid() = profile_id
  );

-- Employees can insert their own time-off requests
CREATE POLICY "employees_insert_own_time_off_requests"
  ON time_off_requests FOR INSERT
  WITH CHECK (
    auth.uid() = profile_id
  );

-- Employees can update only their own time-off requests (only if status is still 'pending')
CREATE POLICY "employees_update_own_time_off_requests"
  ON time_off_requests FOR UPDATE
  USING (
    auth.uid() = profile_id AND status = 'pending'
  )
  WITH CHECK (
    auth.uid() = profile_id AND status = 'pending'
  );

-- Admins can read all time-off requests
CREATE POLICY "admins_read_all_time_off_requests"
  ON time_off_requests FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all time-off requests (for approval/denial)
CREATE POLICY "admins_update_all_time_off_requests"
  ON time_off_requests FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 9. ROW-LEVEL SECURITY POLICIES: CAPACITY_SETTINGS
-- ============================================================================

-- Employees can only read capacity settings (for reference)
CREATE POLICY "employees_read_capacity_settings"
  ON capacity_settings FOR SELECT
  USING (true);

-- Admins can read all capacity settings
CREATE POLICY "admins_read_capacity_settings"
  ON capacity_settings FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can insert new capacity settings
CREATE POLICY "admins_insert_capacity_settings"
  ON capacity_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update capacity settings
CREATE POLICY "admins_update_capacity_settings"
  ON capacity_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================================
-- 10. TRIGGER FUNCTIONS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles
CREATE TRIGGER profiles_update_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to availabilities
CREATE TRIGGER availabilities_update_updated_at
  BEFORE UPDATE ON availabilities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to time_off_requests
CREATE TRIGGER time_off_requests_update_updated_at
  BEFORE UPDATE ON time_off_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to capacity_settings
CREATE TRIGGER capacity_settings_update_updated_at
  BEFORE UPDATE ON capacity_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
