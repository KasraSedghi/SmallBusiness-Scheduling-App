import { ShiftData } from '@/types';

const MINIMUM_SHIFTS = 2;
const MINIMUM_HOURS = 8;
const MAXIMUM_HOURS = 40;

export interface ValidationError {
  code: string;
  message: string;
}

export interface ScheduleConstraints {
  isValid: boolean;
  shiftCount: number;
  totalHours: number;
  errors: ValidationError[];
  warnings: ValidationError[];
}

const SHIFT_HOURS: Record<string, Record<string, number>> = {
  morning: { 'sun-thu': 4, 'fri-sat': 4 },
  afternoon: { 'sun-thu': 4, 'fri-sat': 4 },
  evening: { 'sun-thu': 4, 'fri-sat': 5.5 },
};

export function calculateScheduleMetrics(shiftData: ShiftData): {
  totalHours: number;
  shiftCount: number;
} {
  let totalHours = 0;
  let shiftCount = 0;
  const weekendDays = ['friday', 'saturday'];

  Object.entries(shiftData).forEach(([day, shifts]) => {
    const dayType = weekendDays.includes(day) ? 'fri-sat' : 'sun-thu';

    Object.entries(shifts).forEach(([shiftType, isSelected]) => {
      if (isSelected) {
        totalHours += SHIFT_HOURS[shiftType][dayType];
        shiftCount++;
      }
    });
  });

  return { totalHours, shiftCount };
}

export function validateEmployeeSchedule(shiftData: ShiftData): ScheduleConstraints {
  const { totalHours, shiftCount } = calculateScheduleMetrics(shiftData);
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  if (shiftCount < MINIMUM_SHIFTS) {
    errors.push({
      code: 'INSUFFICIENT_SHIFTS',
      message: `Must select at least ${MINIMUM_SHIFTS} shifts per week (currently ${shiftCount})`,
    });
  }

  if (totalHours < MINIMUM_HOURS) {
    errors.push({
      code: 'INSUFFICIENT_HOURS',
      message: `Must work at least ${MINIMUM_HOURS} hours per week (currently ${totalHours.toFixed(1)}h)`,
    });
  }

  if (totalHours > MAXIMUM_HOURS) {
    errors.push({
      code: 'EXCEEDS_MAXIMUM',
      message: `Cannot work more than ${MAXIMUM_HOURS} hours per week (currently ${totalHours.toFixed(1)}h)`,
    });
  }

  // Warnings for edge cases
  if (shiftCount >= MINIMUM_SHIFTS && totalHours >= MINIMUM_HOURS && totalHours <= 10) {
    warnings.push({
      code: 'LOW_HOURS_WARNING',
      message: `You are working only ${totalHours.toFixed(1)} hours. Consider adding more shifts for better coverage.`,
    });
  }

  if (totalHours >= 35 && totalHours <= MAXIMUM_HOURS) {
    warnings.push({
      code: 'NEAR_MAXIMUM_WARNING',
      message: `You are nearing the maximum of ${MAXIMUM_HOURS} hours per week.`,
    });
  }

  return {
    isValid: errors.length === 0,
    shiftCount,
    totalHours,
    errors,
    warnings,
  };
}

export function isScheduleCompliant(shiftData: ShiftData): boolean {
  const { shiftCount, totalHours } = calculateScheduleMetrics(shiftData);
  return shiftCount >= MINIMUM_SHIFTS && totalHours >= MINIMUM_HOURS && totalHours <= MAXIMUM_HOURS;
}

export function getComplianceReport(shiftData: ShiftData): {
  compliant: boolean;
  shiftCount: number;
  totalHours: number;
  meetsMinimumShifts: boolean;
  meetsMinimumHours: boolean;
  withinMaximumHours: boolean;
} {
  const { shiftCount, totalHours } = calculateScheduleMetrics(shiftData);

  return {
    compliant: isScheduleCompliant(shiftData),
    shiftCount,
    totalHours,
    meetsMinimumShifts: shiftCount >= MINIMUM_SHIFTS,
    meetsMinimumHours: totalHours >= MINIMUM_HOURS,
    withinMaximumHours: totalHours <= MAXIMUM_HOURS,
  };
}

export function getScheduleGaps(shiftData: ShiftData): {
  unselectedDays: string[];
  daysCovered: number;
} {
  const unselectedDays: string[] = [];
  let daysCovered = 0;

  Object.entries(shiftData).forEach(([day, shifts]) => {
    const hasAnyShift = Object.values(shifts).some((selected) => selected);
    if (hasAnyShift) {
      daysCovered++;
    } else {
      unselectedDays.push(day);
    }
  });

  return {
    unselectedDays,
    daysCovered,
  };
}

export function getScheduleBalance(shiftData: ShiftData): {
  averageHoursPerDay: number;
  averageHoursPerShift: number;
  distribution: Record<string, number>;
} {
  const { totalHours, shiftCount } = calculateScheduleMetrics(shiftData);
  const { daysCovered } = getScheduleGaps(shiftData);

  const distribution: Record<string, number> = {};
  const weekendDays = ['friday', 'saturday'];

  Object.entries(shiftData).forEach(([day, shifts]) => {
    let dayHours = 0;
    const dayType = weekendDays.includes(day) ? 'fri-sat' : 'sun-thu';

    Object.entries(shifts).forEach(([shiftType, isSelected]) => {
      if (isSelected) {
        dayHours += SHIFT_HOURS[shiftType][dayType];
      }
    });

    if (dayHours > 0) {
      distribution[day] = dayHours;
    }
  });

  return {
    averageHoursPerDay: daysCovered > 0 ? totalHours / daysCovered : 0,
    averageHoursPerShift: shiftCount > 0 ? totalHours / shiftCount : 0,
    distribution,
  };
}

export function getConstraintStatus(shiftData: ShiftData): {
  shiftCountStatus: 'below' | 'meets' | 'exceeds';
  hoursStatus: 'below' | 'meets' | 'exceeds';
  overallStatus: 'non-compliant' | 'compliant' | 'over-scheduled';
} {
  const { shiftCount, totalHours } = calculateScheduleMetrics(shiftData);

  const shiftCountStatus: 'below' | 'meets' | 'exceeds' =
    shiftCount < MINIMUM_SHIFTS ? 'below' : shiftCount > MINIMUM_SHIFTS ? 'exceeds' : 'meets';

  const hoursStatus: 'below' | 'meets' | 'exceeds' =
    totalHours < MINIMUM_HOURS
      ? 'below'
      : totalHours > MAXIMUM_HOURS
        ? 'exceeds'
        : 'meets';

  let overallStatus: 'non-compliant' | 'compliant' | 'over-scheduled' = 'non-compliant';
  if (isScheduleCompliant(shiftData)) {
    overallStatus = 'compliant';
  } else if (totalHours > MAXIMUM_HOURS) {
    overallStatus = 'over-scheduled';
  }

  return {
    shiftCountStatus,
    hoursStatus,
    overallStatus,
  };
}
