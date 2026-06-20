-- Red Bean Scheduler: Local Development Seed Data
-- Created: 2026-06-20
-- Purpose: Populate database with test fixtures for development and manual testing

-- ============================================================================
-- SEED PROFILES
-- ============================================================================

-- NOTE: In production, profiles are created via Supabase Auth signup
-- For local development, we manually insert UUIDs as if they were created by auth.users

-- Employee 1: John Doe
INSERT INTO profiles (id, email, role, avatar_url, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  'john.doe@redbean.local',
  'employee',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Employee 2: Sarah Smith
INSERT INTO profiles (id, email, role, avatar_url, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  'sarah.smith@redbean.local',
  'employee',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Employee 3: Mike Johnson
INSERT INTO profiles (id, email, role, avatar_url, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  'mike.johnson@redbean.local',
  'employee',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Employee 4: Emma Williams (minimal shifts - edge case)
INSERT INTO profiles (id, email, role, avatar_url, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  'emma.williams@redbean.local',
  'employee',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Admin 1: Alice Manager
INSERT INTO profiles (id, email, role, avatar_url, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440101'::uuid,
  'alice.manager@redbean.local',
  'admin',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Admin 2: Bob Admin
INSERT INTO profiles (id, email, role, avatar_url, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440102'::uuid,
  'bob.admin@redbean.local',
  'admin',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED AVAILABILITIES (Employee Shift Submissions)
-- ============================================================================

-- John Doe: Strong availability (exceeds minimum 2 shifts, 8 hours)
INSERT INTO availabilities (profile_id, week_starting, shift_data, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '2026-06-22'::date,
  '{
    "monday": { "morning": true, "afternoon": false, "evening": false },
    "tuesday": { "morning": true, "afternoon": true, "evening": false },
    "wednesday": { "morning": false, "afternoon": true, "evening": false },
    "thursday": { "morning": false, "afternoon": false, "evening": true },
    "friday": { "morning": true, "afternoon": false, "evening": false },
    "saturday": { "morning": false, "afternoon": true, "evening": false },
    "sunday": { "morning": false, "afternoon": false, "evening": false }
  }'::jsonb,
  'approved',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Sarah Smith: Pending submission (current week)
INSERT INTO availabilities (profile_id, week_starting, shift_data, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  '2026-06-22'::date,
  '{
    "monday": { "morning": false, "afternoon": true, "evening": true },
    "tuesday": { "morning": true, "afternoon": false, "evening": true },
    "wednesday": { "morning": true, "afternoon": true, "evening": false },
    "thursday": { "morning": false, "afternoon": true, "evening": false },
    "friday": { "morning": false, "afternoon": false, "evening": true },
    "saturday": { "morning": true, "afternoon": false, "evening": false },
    "sunday": { "morning": false, "afternoon": false, "evening": false }
  }'::jsonb,
  'pending',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Mike Johnson: Minimal availability (exactly minimum requirement)
INSERT INTO availabilities (profile_id, week_starting, shift_data, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  '2026-06-22'::date,
  '{
    "monday": { "morning": true, "afternoon": false, "evening": false },
    "tuesday": { "morning": false, "afternoon": true, "evening": false },
    "wednesday": { "morning": false, "afternoon": false, "evening": false },
    "thursday": { "morning": false, "afternoon": false, "evening": false },
    "friday": { "morning": false, "afternoon": false, "evening": false },
    "saturday": { "morning": false, "afternoon": false, "evening": false },
    "sunday": { "morning": false, "afternoon": false, "evening": false }
  }'::jsonb,
  'pending',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Emma Williams: Below minimum availability (edge case - violation)
INSERT INTO availabilities (profile_id, week_starting, shift_data, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  '2026-06-22'::date,
  '{
    "monday": { "morning": true, "afternoon": false, "evening": false },
    "tuesday": { "morning": false, "afternoon": false, "evening": false },
    "wednesday": { "morning": false, "afternoon": false, "evening": false },
    "thursday": { "morning": false, "afternoon": false, "evening": false },
    "friday": { "morning": false, "afternoon": false, "evening": false },
    "saturday": { "morning": false, "afternoon": false, "evening": false },
    "sunday": { "morning": false, "afternoon": false, "evening": false }
  }'::jsonb,
  'pending',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- John Doe: Previous week (approved)
INSERT INTO availabilities (profile_id, week_starting, shift_data, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001'::uuid,
  '2026-06-15'::date,
  '{
    "monday": { "morning": true, "afternoon": true, "evening": false },
    "tuesday": { "morning": false, "afternoon": true, "evening": true },
    "wednesday": { "morning": true, "afternoon": false, "evening": false },
    "thursday": { "morning": true, "afternoon": true, "evening": false },
    "friday": { "morning": false, "afternoon": false, "evening": true },
    "saturday": { "morning": true, "afternoon": false, "evening": false },
    "sunday": { "morning": false, "afternoon": false, "evening": false }
  }'::jsonb,
  'approved',
  NOW() - INTERVAL '1 week',
  NOW() - INTERVAL '1 week'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED TIME-OFF REQUESTS
-- ============================================================================

-- Sarah Smith: Approved time off (summer vacation)
INSERT INTO time_off_requests (profile_id, start_date, end_date, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002'::uuid,
  '2026-07-06'::date,
  '2026-07-12'::date,
  'approved',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Mike Johnson: Pending time off (next week)
INSERT INTO time_off_requests (profile_id, start_date, end_date, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440003'::uuid,
  '2026-06-29'::date,
  '2026-06-30'::date,
  'pending',
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Emma Williams: Denied time off
INSERT INTO time_off_requests (profile_id, start_date, end_date, status, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440004'::uuid,
  '2026-07-01'::date,
  '2026-07-05'::date,
  'denied',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED CAPACITY SETTINGS
-- ============================================================================

-- This week's capacity limits
INSERT INTO capacity_settings (week_starting, rules, created_at, updated_at)
VALUES (
  '2026-06-22'::date,
  '{
    "capacity": {
      "monday": { "morning": 3, "afternoon": 3, "evening": 2 },
      "tuesday": { "morning": 3, "afternoon": 3, "evening": 2 },
      "wednesday": { "morning": 2, "afternoon": 3, "evening": 2 },
      "thursday": { "morning": 3, "afternoon": 2, "evening": 2 },
      "friday": { "morning": 2, "afternoon": 3, "evening": 3 },
      "saturday": { "morning": 2, "afternoon": 2, "evening": 3 },
      "sunday": { "morning": 1, "afternoon": 1, "evening": 1 }
    },
    "holiday_overrides": {}
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- Next week's capacity limits
INSERT INTO capacity_settings (week_starting, rules, created_at, updated_at)
VALUES (
  '2026-06-29'::date,
  '{
    "capacity": {
      "monday": { "morning": 3, "afternoon": 3, "evening": 2 },
      "tuesday": { "morning": 3, "afternoon": 3, "evening": 2 },
      "wednesday": { "morning": 2, "afternoon": 3, "evening": 2 },
      "thursday": { "morning": 3, "afternoon": 2, "evening": 2 },
      "friday": { "morning": 2, "afternoon": 3, "evening": 3 },
      "saturday": { "morning": 2, "afternoon": 2, "evening": 3 },
      "sunday": { "morning": 1, "afternoon": 1, "evening": 1 }
    },
    "holiday_overrides": {}
  }'::jsonb,
  NOW(),
  NOW()
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED NOTES
-- ============================================================================
-- This seed data creates:
-- - 4 employees (1 with edge case: below minimum shifts)
-- - 2 admins
-- - 5 availability records across 2 weeks
-- - 3 time-off requests with different statuses
-- - 2 capacity settings weeks
--
-- Use cases covered:
-- 1. Approved + pending availabilities
-- 2. Edge case: employee with minimal availability (violation detection test)
-- 3. Time-off requests in all states (pending, approved, denied)
-- 4. Multiple weeks of scheduling
