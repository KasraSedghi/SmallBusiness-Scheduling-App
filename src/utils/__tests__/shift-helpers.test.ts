import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  calculateTotalHours,
  calculateTotalShifts,
  isSubmissionDeadlinePassedForWeek,
  getWeekStartingDate,
  getHoursUntilDeadline,
} from '../shift-helpers';
import { ShiftData, emptyShiftData } from '@/types';

describe('Shift Helpers', () => {
  describe('calculateTotalHours', () => {
    it('calculates 0 hours for empty shift data', () => {
      const shiftData = emptyShiftData();
      expect(calculateTotalHours(shiftData)).toBe(0);
    });

    it('calculates hours for single morning shift (4 hours)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      expect(calculateTotalHours(shiftData)).toBe(4);
    });

    it('calculates hours for single afternoon shift (4 hours)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.afternoon = true;
      expect(calculateTotalHours(shiftData)).toBe(4);
    });

    it('calculates hours for single evening shift on weekday (4 hours)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.evening = true;
      expect(calculateTotalHours(shiftData)).toBe(4);
    });

    it('calculates hours for single evening shift on Friday (5.5 hours)', () => {
      const shiftData = emptyShiftData();
      shiftData.friday.evening = true;
      expect(calculateTotalHours(shiftData)).toBe(5.5);
    });

    it('calculates hours for single evening shift on Saturday (5.5 hours)', () => {
      const shiftData = emptyShiftData();
      shiftData.saturday.evening = true;
      expect(calculateTotalHours(shiftData)).toBe(5.5);
    });

    it('calculates combined hours for multiple shifts', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true; // 4
      shiftData.monday.afternoon = true; // 4
      expect(calculateTotalHours(shiftData)).toBe(8);
    });

    it('calculates combined hours across multiple days', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true; // 4
      shiftData.tuesday.afternoon = true; // 4
      expect(calculateTotalHours(shiftData)).toBe(8);
    });

    it('calculates correct hours with weekend evening shifts', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true; // 4
      shiftData.friday.evening = true; // 5.5
      expect(calculateTotalHours(shiftData)).toBe(9.5);
    });

    it('calculates maximum hours (all shifts)', () => {
      const shiftData = emptyShiftData();
      Object.keys(shiftData).forEach((day) => {
        shiftData[day as keyof ShiftData].morning = true;
        shiftData[day as keyof ShiftData].afternoon = true;
        shiftData[day as keyof ShiftData].evening = true;
      });
      // 5 weekdays * (4+4+4) + 2 weekend days * (4+4+5.5) = 60 + 27 = 87
      expect(calculateTotalHours(shiftData)).toBe(87);
    });
  });

  describe('calculateTotalShifts', () => {
    it('counts 0 shifts for empty data', () => {
      const shiftData = emptyShiftData();
      expect(calculateTotalShifts(shiftData)).toBe(0);
    });

    it('counts 1 shift', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      expect(calculateTotalShifts(shiftData)).toBe(1);
    });

    it('counts multiple shifts on same day', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      shiftData.monday.evening = true;
      expect(calculateTotalShifts(shiftData)).toBe(3);
    });

    it('counts shifts across multiple days', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.tuesday.afternoon = true;
      shiftData.wednesday.evening = true;
      expect(calculateTotalShifts(shiftData)).toBe(3);
    });

    it('counts all 21 shifts when all selected', () => {
      const shiftData = emptyShiftData();
      Object.keys(shiftData).forEach((day) => {
        shiftData[day as keyof ShiftData].morning = true;
        shiftData[day as keyof ShiftData].afternoon = true;
        shiftData[day as keyof ShiftData].evening = true;
      });
      expect(calculateTotalShifts(shiftData)).toBe(21);
    });
  });

  describe('isSubmissionDeadlinePassedForWeek', () => {
    it('returns a boolean value', () => {
      const weekStarting = '2026-06-21';
      const result = isSubmissionDeadlinePassedForWeek(weekStarting);
      expect(typeof result).toBe('boolean');
    });

    it('returns true for past deadlines', () => {
      // Set time far in the future
      const futureDate = new Date('2030-01-01T12:00:00');
      vi.useFakeTimers();
      vi.setSystemTime(futureDate);

      const weekStarting = '2026-06-21';
      expect(isSubmissionDeadlinePassedForWeek(weekStarting)).toBe(true);

      vi.useRealTimers();
    });

    it('returns false for future deadlines', () => {
      // Set time to way in the past
      const pastDate = new Date('2020-01-01T12:00:00');
      vi.useFakeTimers();
      vi.setSystemTime(pastDate);

      const weekStarting = '2026-06-21';
      expect(isSubmissionDeadlinePassedForWeek(weekStarting)).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('getWeekStartingDate', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns correct week start for a Sunday before the deadline', () => {
      const mockDate = new Date('2026-06-21T12:00:00Z'); // Sunday, 5AM PDT (before 10AM local deadline)
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const result = getWeekStartingDate();
      expect(result).toBe('2026-06-21');
    });

    it('rolls forward to next week once the Sunday deadline has passed (Monday)', () => {
      const mockDate = new Date('2026-06-22T12:00:00Z'); // Monday
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const result = getWeekStartingDate();
      expect(result).toBe('2026-06-28'); // following Sunday
    });

    it('rolls forward to next week once the Sunday deadline has passed (Wednesday)', () => {
      const mockDate = new Date('2026-06-24T12:00:00Z'); // Wednesday
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const result = getWeekStartingDate();
      expect(result).toBe('2026-06-28'); // following Sunday
    });

    it('rolls forward to next week once the Sunday deadline has passed (Friday)', () => {
      const mockDate = new Date('2026-06-26T12:00:00Z'); // Friday
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const result = getWeekStartingDate();
      expect(result).toBe('2026-06-28'); // following Sunday
    });

    it('rolls forward to next week once the Sunday deadline has passed (Saturday)', () => {
      const mockDate = new Date('2026-06-27T12:00:00Z'); // Saturday
      vi.useFakeTimers();
      vi.setSystemTime(mockDate);

      const result = getWeekStartingDate();
      expect(result).toBe('2026-06-28'); // following Sunday
    });
  });

  describe('getHoursUntilDeadline', () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it('returns a non-negative number', () => {
      const weekStarting = '2026-06-21';
      const hours = getHoursUntilDeadline(weekStarting);
      expect(typeof hours).toBe('number');
      expect(hours).toBeGreaterThanOrEqual(0);
    });

    it('returns positive hours for future deadlines', () => {
      const pastDate = new Date('2020-01-01T12:00:00');
      vi.useFakeTimers();
      vi.setSystemTime(pastDate);

      const weekStarting = '2026-06-21';
      const hours = getHoursUntilDeadline(weekStarting);
      expect(hours).toBeGreaterThan(0);

      vi.useRealTimers();
    });

    it('returns 0 for past deadlines', () => {
      const futureDate = new Date('2030-01-01T12:00:00');
      vi.useFakeTimers();
      vi.setSystemTime(futureDate);

      const weekStarting = '2026-06-21';
      const hours = getHoursUntilDeadline(weekStarting);
      expect(hours).toBe(0);

      vi.useRealTimers();
    });
  });
});
