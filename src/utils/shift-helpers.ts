import { ShiftData } from '@/types';

const SHIFT_HOURS: Record<string, Record<string, number>> = {
  morning: { 'sun-thu': 4, 'fri-sat': 4 },
  afternoon: { 'sun-thu': 4, 'fri-sat': 4 },
  evening: { 'sun-thu': 4, 'fri-sat': 5.5 },
};

export function calculateTotalHours(shiftData: ShiftData): number {
  let total = 0;

  const weekendDays = ['friday', 'saturday'];

  Object.entries(shiftData).forEach(([day, shifts]) => {
    const dayType = weekendDays.includes(day) ? 'fri-sat' : 'sun-thu';

    Object.entries(shifts).forEach(([shiftType, isSelected]) => {
      if (isSelected) {
        total += SHIFT_HOURS[shiftType][dayType];
      }
    });
  });

  return total;
}

export function calculateTotalShifts(shiftData: ShiftData): number {
  let count = 0;

  Object.values(shiftData).forEach((dayShifts) => {
    Object.values(dayShifts).forEach((isSelected) => {
      if (isSelected) count++;
    });
  });

  return count;
}

export function isSubmissionDeadlinePassedForWeek(weekStartingDate: string): boolean {
  const deadline = new Date(weekStartingDate);
  deadline.setHours(10, 0, 0, 0);
  return new Date() > deadline;
}

export function getWeekStartingDate(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diff = today.getDate() - dayOfWeek;

  const weekStart = new Date(today);
  weekStart.setDate(diff);
  return weekStart.toISOString().split('T')[0];
}

export function getHoursUntilDeadline(weekStartingDate: string): number {
  const deadline = new Date(weekStartingDate);
  deadline.setHours(10, 0, 0, 0);

  const now = new Date();
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));

  return Math.max(0, diffHours);
}
