/**
 * Test Fixtures for Red Bean Scheduler
 * Used for unit tests, integration tests, and manual testing
 * Created: 2026-06-20
 */

import { Profile, Availability, TimeOffRequest, CapacitySetting, ShiftData } from '@/types';

// ============================================================================
// PROFILE FIXTURES
// ============================================================================

export const profileFixtures = {
  employee_john: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'john.doe@redbean.local',
    role: 'employee' as const,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    created_at: '2026-06-15T10:00:00Z',
    updated_at: '2026-06-15T10:00:00Z',
  } as Profile,

  employee_sarah: {
    id: '550e8400-e29b-41d4-a716-446655440002',
    email: 'sarah.smith@redbean.local',
    role: 'employee' as const,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
    created_at: '2026-06-15T10:00:00Z',
    updated_at: '2026-06-15T10:00:00Z',
  } as Profile,

  employee_mike: {
    id: '550e8400-e29b-41d4-a716-446655440003',
    email: 'mike.johnson@redbean.local',
    role: 'employee' as const,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mike',
    created_at: '2026-06-15T10:00:00Z',
    updated_at: '2026-06-15T10:00:00Z',
  } as Profile,

  employee_emma: {
    id: '550e8400-e29b-41d4-a716-446655440004',
    email: 'emma.williams@redbean.local',
    role: 'employee' as const,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=emma',
    created_at: '2026-06-15T10:00:00Z',
    updated_at: '2026-06-15T10:00:00Z',
  } as Profile,

  admin_alice: {
    id: '550e8400-e29b-41d4-a716-446655440101',
    email: 'alice.manager@redbean.local',
    role: 'admin' as const,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    created_at: '2026-06-15T10:00:00Z',
    updated_at: '2026-06-15T10:00:00Z',
  } as Profile,

  admin_bob: {
    id: '550e8400-e29b-41d4-a716-446655440102',
    email: 'bob.admin@redbean.local',
    role: 'admin' as const,
    avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    created_at: '2026-06-15T10:00:00Z',
    updated_at: '2026-06-15T10:00:00Z',
  } as Profile,
};

// ============================================================================
// SHIFT DATA FIXTURES
// ============================================================================

export const shiftDataFixtures = {
  // Strong availability: exceeds 2 shifts & 8 hours minimum
  heavy_availability: {
    monday: { morning: true, afternoon: false, evening: false },
    tuesday: { morning: true, afternoon: true, evening: false },
    wednesday: { morning: false, afternoon: true, evening: false },
    thursday: { morning: false, afternoon: false, evening: true },
    friday: { morning: true, afternoon: false, evening: false },
    saturday: { morning: false, afternoon: true, evening: false },
    sunday: { morning: false, afternoon: false, evening: false },
  } as ShiftData,

  // Moderate availability: meets minimum requirement
  moderate_availability: {
    monday: { morning: false, afternoon: true, evening: true },
    tuesday: { morning: true, afternoon: false, evening: true },
    wednesday: { morning: true, afternoon: true, evening: false },
    thursday: { morning: false, afternoon: true, evening: false },
    friday: { morning: false, afternoon: false, evening: true },
    saturday: { morning: true, afternoon: false, evening: false },
    sunday: { morning: false, afternoon: false, evening: false },
  } as ShiftData,

  // Minimal availability: exactly meets minimum (2 shifts)
  minimal_availability: {
    monday: { morning: true, afternoon: false, evening: false },
    tuesday: { morning: false, afternoon: true, evening: false },
    wednesday: { morning: false, afternoon: false, evening: false },
    thursday: { morning: false, afternoon: false, evening: false },
    friday: { morning: false, afternoon: false, evening: false },
    saturday: { morning: false, afternoon: false, evening: false },
    sunday: { morning: false, afternoon: false, evening: false },
  } as ShiftData,

  // Below minimum: only 1 shift (edge case for validation)
  insufficient_availability: {
    monday: { morning: true, afternoon: false, evening: false },
    tuesday: { morning: false, afternoon: false, evening: false },
    wednesday: { morning: false, afternoon: false, evening: false },
    thursday: { morning: false, afternoon: false, evening: false },
    friday: { morning: false, afternoon: false, evening: false },
    saturday: { morning: false, afternoon: false, evening: false },
    sunday: { morning: false, afternoon: false, evening: false },
  } as ShiftData,

  // No availability
  empty_availability: {
    monday: { morning: false, afternoon: false, evening: false },
    tuesday: { morning: false, afternoon: false, evening: false },
    wednesday: { morning: false, afternoon: false, evening: false },
    thursday: { morning: false, afternoon: false, evening: false },
    friday: { morning: false, afternoon: false, evening: false },
    saturday: { morning: false, afternoon: false, evening: false },
    sunday: { morning: false, afternoon: false, evening: false },
  } as ShiftData,

  // Weekend-only availability
  weekend_only: {
    monday: { morning: false, afternoon: false, evening: false },
    tuesday: { morning: false, afternoon: false, evening: false },
    wednesday: { morning: false, afternoon: false, evening: false },
    thursday: { morning: false, afternoon: false, evening: false },
    friday: { morning: false, afternoon: false, evening: false },
    saturday: { morning: true, afternoon: true, evening: false },
    sunday: { morning: true, afternoon: false, evening: false },
  } as ShiftData,
};

// ============================================================================
// AVAILABILITY FIXTURES
// ============================================================================

export const availabilityFixtures = {
  john_week_of_june22_approved: {
    id: 'avail-001',
    profile_id: profileFixtures.employee_john.id,
    week_starting: '2026-06-22',
    shift_data: shiftDataFixtures.heavy_availability,
    status: 'approved' as const,
    created_at: '2026-06-20T08:00:00Z',
    updated_at: '2026-06-20T08:00:00Z',
  } as Availability,

  sarah_week_of_june22_pending: {
    id: 'avail-002',
    profile_id: profileFixtures.employee_sarah.id,
    week_starting: '2026-06-22',
    shift_data: shiftDataFixtures.moderate_availability,
    status: 'pending' as const,
    created_at: '2026-06-20T09:15:00Z',
    updated_at: '2026-06-20T09:15:00Z',
  } as Availability,

  mike_week_of_june22_pending_minimal: {
    id: 'avail-003',
    profile_id: profileFixtures.employee_mike.id,
    week_starting: '2026-06-22',
    shift_data: shiftDataFixtures.minimal_availability,
    status: 'pending' as const,
    created_at: '2026-06-20T10:30:00Z',
    updated_at: '2026-06-20T10:30:00Z',
  } as Availability,

  emma_week_of_june22_pending_violation: {
    id: 'avail-004',
    profile_id: profileFixtures.employee_emma.id,
    week_starting: '2026-06-22',
    shift_data: shiftDataFixtures.insufficient_availability,
    status: 'pending' as const,
    created_at: '2026-06-20T11:45:00Z',
    updated_at: '2026-06-20T11:45:00Z',
  } as Availability,

  john_week_of_june15_approved: {
    id: 'avail-005',
    profile_id: profileFixtures.employee_john.id,
    week_starting: '2026-06-15',
    shift_data: shiftDataFixtures.heavy_availability,
    status: 'approved' as const,
    created_at: '2026-06-13T08:00:00Z',
    updated_at: '2026-06-13T08:00:00Z',
  } as Availability,
};

// ============================================================================
// TIME-OFF REQUEST FIXTURES
// ============================================================================

export const timeOffFixtures = {
  sarah_summer_vacation_approved: {
    id: 'toff-001',
    profile_id: profileFixtures.employee_sarah.id,
    start_date: '2026-07-06',
    end_date: '2026-07-12',
    status: 'approved' as const,
    created_at: '2026-06-10T14:00:00Z',
    updated_at: '2026-06-15T10:00:00Z',
  } as TimeOffRequest,

  mike_next_week_pending: {
    id: 'toff-002',
    profile_id: profileFixtures.employee_mike.id,
    start_date: '2026-06-29',
    end_date: '2026-06-30',
    status: 'pending' as const,
    created_at: '2026-06-20T09:00:00Z',
    updated_at: '2026-06-20T09:00:00Z',
  } as TimeOffRequest,

  emma_early_july_denied: {
    id: 'toff-003',
    profile_id: profileFixtures.employee_emma.id,
    start_date: '2026-07-01',
    end_date: '2026-07-05',
    status: 'denied' as const,
    created_at: '2026-06-17T16:30:00Z',
    updated_at: '2026-06-17T17:00:00Z',
  } as TimeOffRequest,
};

// ============================================================================
// CAPACITY SETTINGS FIXTURES
// ============================================================================

export const capacityFixtures = {
  week_of_june22: {
    id: 'cap-001',
    week_starting: '2026-06-22',
    rules: {
      capacity: {
        monday: { morning: 3, afternoon: 3, evening: 2 },
        tuesday: { morning: 3, afternoon: 3, evening: 2 },
        wednesday: { morning: 2, afternoon: 3, evening: 2 },
        thursday: { morning: 3, afternoon: 2, evening: 2 },
        friday: { morning: 2, afternoon: 3, evening: 3 },
        saturday: { morning: 2, afternoon: 2, evening: 3 },
        sunday: { morning: 1, afternoon: 1, evening: 1 },
      },
      holiday_overrides: {},
    },
    created_at: '2026-06-20T08:00:00Z',
    updated_at: '2026-06-20T08:00:00Z',
  } as CapacitySetting,

  week_of_june29: {
    id: 'cap-002',
    week_starting: '2026-06-29',
    rules: {
      capacity: {
        monday: { morning: 3, afternoon: 3, evening: 2 },
        tuesday: { morning: 3, afternoon: 3, evening: 2 },
        wednesday: { morning: 2, afternoon: 3, evening: 2 },
        thursday: { morning: 3, afternoon: 2, evening: 2 },
        friday: { morning: 2, afternoon: 3, evening: 3 },
        saturday: { morning: 2, afternoon: 2, evening: 3 },
        sunday: { morning: 1, afternoon: 1, evening: 1 },
      },
      holiday_overrides: {},
    },
    created_at: '2026-06-20T08:00:00Z',
    updated_at: '2026-06-20T08:00:00Z',
  } as CapacitySetting,

  week_of_july4_with_holiday: {
    id: 'cap-003',
    week_starting: '2026-06-29',
    rules: {
      capacity: {
        monday: { morning: 3, afternoon: 3, evening: 2 },
        tuesday: { morning: 3, afternoon: 3, evening: 2 },
        wednesday: { morning: 2, afternoon: 3, evening: 2 },
        thursday: { morning: 1, afternoon: 1, evening: 1 }, // July 4th - reduced
        friday: { morning: 2, afternoon: 3, evening: 3 },
        saturday: { morning: 2, afternoon: 2, evening: 3 },
        sunday: { morning: 1, afternoon: 1, evening: 1 },
      },
      holiday_overrides: {
        '2026-07-04': { morning: 1, afternoon: 1, evening: 1 },
      },
    },
    created_at: '2026-06-20T08:00:00Z',
    updated_at: '2026-06-20T08:00:00Z',
  } as CapacitySetting,
};

// ============================================================================
// HELPER FUNCTIONS FOR TESTS
// ============================================================================

/**
 * Create a mock profile with defaults
 */
export function createMockProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: '550e8400-e29b-41d4-a716-000000000000',
    email: 'test@example.local',
    role: 'employee',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock availability with defaults
 */
export function createMockAvailability(overrides: Partial<Availability> = {}): Availability {
  return {
    id: 'avail-test-' + Math.random().toString(36).substr(2, 9),
    profile_id: '550e8400-e29b-41d4-a716-000000000000',
    week_starting: '2026-06-22',
    shift_data: shiftDataFixtures.empty_availability,
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create a mock time-off request with defaults
 */
export function createMockTimeOffRequest(overrides: Partial<TimeOffRequest> = {}): TimeOffRequest {
  return {
    id: 'toff-test-' + Math.random().toString(36).substr(2, 9),
    profile_id: '550e8400-e29b-41d4-a716-000000000000',
    start_date: '2026-07-01',
    end_date: '2026-07-05',
    status: 'pending',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
