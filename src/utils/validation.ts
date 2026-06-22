// Schedule validation helpers

export interface ScheduleValidation {
  isValid: boolean;
  errors: string[];
}

const MINIMUM_SHIFTS = 2;
const MINIMUM_HOURS = 8;
const MINIMUM_SHIFT_DURATION = 3;
const MAXIMUM_WEEKLY_HOURS = 40;

export function validateSchedule(
  shifts: Array<{ hours: number }>,
  totalHours: number
): ScheduleValidation {
  const errors: string[] = [];

  if (shifts.length < MINIMUM_SHIFTS) {
    errors.push(
      `Must select at least ${MINIMUM_SHIFTS} shifts per week`
    );
  }

  if (totalHours < MINIMUM_HOURS) {
    errors.push(
      `Must work at least ${MINIMUM_HOURS} hours per week`
    );
  }

  if (totalHours > MAXIMUM_WEEKLY_HOURS) {
    errors.push(
      `Cannot work more than ${MAXIMUM_WEEKLY_HOURS} hours per week`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateShiftDuration(hours: number): ScheduleValidation {
  const errors: string[] = [];

  if (hours < MINIMUM_SHIFT_DURATION) {
    errors.push(
      `Each shift must be at least ${MINIMUM_SHIFT_DURATION} hours`
    );
  }

  if (hours > MAXIMUM_WEEKLY_HOURS) {
    errors.push(
      `A single shift cannot exceed ${MAXIMUM_WEEKLY_HOURS} hours`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export interface ShiftCapacityConfig {
  isHoliday: boolean;
  standardCapacity: number;
  holidayCapacity: number;
}

export function validateShiftCapacity(
  totalHours: number,
  config: ShiftCapacityConfig
): ScheduleValidation {
  const errors: string[] = [];
  const maxCapacity = config.isHoliday
    ? config.holidayCapacity
    : config.standardCapacity;

  if (totalHours > maxCapacity) {
    errors.push(
      `Cannot exceed ${maxCapacity} hours on ${config.isHoliday ? 'holiday' : 'standard'} weeks`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePassword(password: string): ScheduleValidation {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export const OPERATING_HOURS = {
  SUNDAY_TO_THURSDAY: { start: '09:00', end: '21:00' },
  FRIDAY_SATURDAY: { start: '09:00', end: '22:30' },
};

export const SCHEDULE_DEADLINE = {
  day: 'Sunday',
  time: '10:00 AM',
};
