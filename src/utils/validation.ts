// Schedule validation helpers

export interface ScheduleValidation {
  isValid: boolean;
  errors: string[];
}

const MINIMUM_SHIFTS = 2;
const MINIMUM_HOURS = 8;

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
