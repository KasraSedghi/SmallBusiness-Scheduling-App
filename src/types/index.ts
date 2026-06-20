// ============================================================================
// PROFILE TYPES
// ============================================================================

export type UserRole = 'employee' | 'admin';

export interface Profile {
  id: string; // UUID
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================================================
// SHIFT DATA TYPES
// ============================================================================

export type ShiftType = 'morning' | 'afternoon' | 'evening';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface DayShifts {
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
}

export interface ShiftData {
  monday: DayShifts;
  tuesday: DayShifts;
  wednesday: DayShifts;
  thursday: DayShifts;
  friday: DayShifts;
  saturday: DayShifts;
  sunday: DayShifts;
}

// Helper to get empty shift data
export const emptyShiftData = (): ShiftData => ({
  monday: { morning: false, afternoon: false, evening: false },
  tuesday: { morning: false, afternoon: false, evening: false },
  wednesday: { morning: false, afternoon: false, evening: false },
  thursday: { morning: false, afternoon: false, evening: false },
  friday: { morning: false, afternoon: false, evening: false },
  saturday: { morning: false, afternoon: false, evening: false },
  sunday: { morning: false, afternoon: false, evening: false },
});

// ============================================================================
// AVAILABILITY TYPES
// ============================================================================

export type AvailabilityStatus = 'pending' | 'approved';

export interface Availability {
  id: string; // UUID
  profile_id: string; // UUID, references profiles
  week_starting: string; // ISO date
  shift_data: ShiftData;
  status: AvailabilityStatus;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================================================
// TIME-OFF REQUEST TYPES
// ============================================================================

export type TimeOffStatus = 'pending' | 'approved' | 'denied';

export interface TimeOffRequest {
  id: string; // UUID
  profile_id: string; // UUID, references profiles
  start_date: string; // ISO date
  end_date: string; // ISO date
  status: TimeOffStatus;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================================================
// CAPACITY SETTINGS TYPES
// ============================================================================

export interface ShiftCapacity {
  morning: number;
  afternoon: number;
  evening: number;
}

export interface CapacityRules {
  capacity: {
    monday: ShiftCapacity;
    tuesday: ShiftCapacity;
    wednesday: ShiftCapacity;
    thursday: ShiftCapacity;
    friday: ShiftCapacity;
    saturday: ShiftCapacity;
    sunday: ShiftCapacity;
  };
  holiday_overrides: Record<string, ShiftCapacity>;
}

export interface CapacitySetting {
  id: string; // UUID
  week_starting: string; // ISO date
  rules: CapacityRules;
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================================================
// LEGACY TYPE ALIASES (for backwards compatibility during migration)
// ============================================================================

export type User = Profile;
export type ScheduleSubmission = Availability;
