import { describe, it, expect } from 'vitest';
import {
  calculateScheduleMetrics,
  validateEmployeeSchedule,
  isScheduleCompliant,
  getComplianceReport,
  getScheduleGaps,
  getScheduleBalance,
  getConstraintStatus,
  ScheduleConstraints,
} from '../validation';
import { ShiftData, emptyShiftData } from '@/types';

describe('Constraint Validation Logic', () => {
  describe('calculateScheduleMetrics', () => {
    it('returns 0 hours and 0 shifts for empty schedule', () => {
      const shiftData = emptyShiftData();
      const metrics = calculateScheduleMetrics(shiftData);

      expect(metrics.totalHours).toBe(0);
      expect(metrics.shiftCount).toBe(0);
    });

    it('calculates single morning shift as 4 hours and 1 shift', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      const metrics = calculateScheduleMetrics(shiftData);

      expect(metrics.totalHours).toBe(4);
      expect(metrics.shiftCount).toBe(1);
    });

    it('calculates multiple shifts on same day correctly', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      shiftData.monday.evening = true;
      const metrics = calculateScheduleMetrics(shiftData);

      expect(metrics.totalHours).toBe(12);
      expect(metrics.shiftCount).toBe(3);
    });

    it('accounts for weekend evening variation (5.5h)', () => {
      const shiftData = emptyShiftData();
      shiftData.friday.evening = true;
      shiftData.saturday.evening = true;
      const metrics = calculateScheduleMetrics(shiftData);

      expect(metrics.totalHours).toBe(11);
      expect(metrics.shiftCount).toBe(2);
    });

    it('correctly differentiates weekday evening (4h) from weekend evening (5.5h)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.evening = true;
      shiftData.friday.evening = true;
      const metrics = calculateScheduleMetrics(shiftData);

      expect(metrics.totalHours).toBe(9.5);
      expect(metrics.shiftCount).toBe(2);
    });

    it('calculates all 21 shifts with correct total (87 hours)', () => {
      const shiftData = emptyShiftData();
      Object.keys(shiftData).forEach((day) => {
        shiftData[day as keyof ShiftData].morning = true;
        shiftData[day as keyof ShiftData].afternoon = true;
        shiftData[day as keyof ShiftData].evening = true;
      });
      const metrics = calculateScheduleMetrics(shiftData);

      expect(metrics.shiftCount).toBe(21);
      expect(metrics.totalHours).toBe(87);
    });
  });

  describe('validateEmployeeSchedule', () => {
    it('marks empty schedule as invalid with both shift and hour errors', () => {
      const shiftData = emptyShiftData();
      const validation = validateEmployeeSchedule(shiftData);

      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBe(2);
      expect(validation.errors.some((e) => e.code === 'INSUFFICIENT_SHIFTS')).toBe(true);
      expect(validation.errors.some((e) => e.code === 'INSUFFICIENT_HOURS')).toBe(true);
    });

    it('marks single shift as invalid (insufficient shifts and hours)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      const validation = validateEmployeeSchedule(shiftData);

      expect(validation.isValid).toBe(false);
      expect(validation.shiftCount).toBe(1);
      expect(validation.totalHours).toBe(4);
    });

    it('marks exact minimum (2 shifts, 8 hours) as valid', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      const validation = validateEmployeeSchedule(shiftData);

      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
      expect(validation.shiftCount).toBe(2);
      expect(validation.totalHours).toBe(8);
    });

    it('marks 3 shifts, 12 hours as valid', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      shiftData.tuesday.morning = true;
      const validation = validateEmployeeSchedule(shiftData);

      expect(validation.isValid).toBe(true);
      expect(validation.shiftCount).toBe(3);
      expect(validation.totalHours).toBe(12);
    });

    it('marks 40 hours exactly as valid', () => {
      const shiftData = emptyShiftData();
      // 10 shifts × 4 hours = 40 hours
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      shiftData.monday.evening = true;
      shiftData.tuesday.morning = true;
      shiftData.tuesday.afternoon = true;
      shiftData.tuesday.evening = true;
      shiftData.wednesday.morning = true;
      shiftData.wednesday.afternoon = true;
      shiftData.thursday.morning = true;
      shiftData.thursday.afternoon = true;

      const validation = validateEmployeeSchedule(shiftData);
      expect(validation.isValid).toBe(true);
      expect(validation.totalHours).toBe(40);
    });

    it('marks over 40 hours as invalid with exceeds error', () => {
      const shiftData = emptyShiftData();
      Object.keys(shiftData).forEach((day) => {
        shiftData[day as keyof ShiftData].morning = true;
        shiftData[day as keyof ShiftData].afternoon = true;
        shiftData[day as keyof ShiftData].evening = true;
      });

      const validation = validateEmployeeSchedule(shiftData);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some((e) => e.code === 'EXCEEDS_MAXIMUM')).toBe(true);
      expect(validation.totalHours).toBe(87);
    });

    it('generates low hours warning for valid but minimal schedule', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      const validation = validateEmployeeSchedule(shiftData);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some((w) => w.code === 'LOW_HOURS_WARNING')).toBe(true);
    });

    it('generates near maximum warning for 35-40 hour schedule', () => {
      const shiftData = emptyShiftData();
      // 9 shifts × 4 hours = 36 hours (in 35-40 range)
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      shiftData.monday.evening = true;
      shiftData.tuesday.morning = true;
      shiftData.tuesday.afternoon = true;
      shiftData.tuesday.evening = true;
      shiftData.wednesday.morning = true;
      shiftData.wednesday.afternoon = true;
      shiftData.thursday.morning = true;

      const validation = validateEmployeeSchedule(shiftData);
      expect(validation.isValid).toBe(true);
      expect(validation.warnings.some((w) => w.code === 'NEAR_MAXIMUM_WARNING')).toBe(true);
    });

    it('does not generate warnings for mid-range valid schedule (12-34 hours)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      shiftData.tuesday.morning = true;
      shiftData.wednesday.afternoon = true;
      shiftData.thursday.morning = true;
      const validation = validateEmployeeSchedule(shiftData);

      expect(validation.isValid).toBe(true);
      expect(validation.warnings.length).toBe(0);
    });
  });

  describe('isScheduleCompliant', () => {
    it('returns false for empty schedule', () => {
      const shiftData = emptyShiftData();
      expect(isScheduleCompliant(shiftData)).toBe(false);
    });

    it('returns false for single shift', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      expect(isScheduleCompliant(shiftData)).toBe(false);
    });

    it('returns true for 2 shifts, 8 hours', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      expect(isScheduleCompliant(shiftData)).toBe(true);
    });

    it('returns true for any valid middle-range schedule', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.tuesday.afternoon = true;
      shiftData.wednesday.evening = true;
      expect(isScheduleCompliant(shiftData)).toBe(true);
    });

    it('returns false for over 40 hours', () => {
      const shiftData = emptyShiftData();
      Object.keys(shiftData).forEach((day) => {
        shiftData[day as keyof ShiftData].morning = true;
        shiftData[day as keyof ShiftData].afternoon = true;
        shiftData[day as keyof ShiftData].evening = true;
      });
      expect(isScheduleCompliant(shiftData)).toBe(false);
    });
  });

  describe('getComplianceReport', () => {
    it('returns detailed compliance status for compliant schedule', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      const report = getComplianceReport(shiftData);

      expect(report.compliant).toBe(true);
      expect(report.meetsMinimumShifts).toBe(true);
      expect(report.meetsMinimumHours).toBe(true);
      expect(report.withinMaximumHours).toBe(true);
      expect(report.shiftCount).toBe(2);
      expect(report.totalHours).toBe(8);
    });

    it('returns detailed compliance status for non-compliant schedule', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      const report = getComplianceReport(shiftData);

      expect(report.compliant).toBe(false);
      expect(report.meetsMinimumShifts).toBe(false);
      expect(report.meetsMinimumHours).toBe(false);
      expect(report.withinMaximumHours).toBe(true);
      expect(report.shiftCount).toBe(1);
      expect(report.totalHours).toBe(4);
    });

    it('marks over-scheduled as non-compliant but hours exceeded', () => {
      const shiftData = emptyShiftData();
      Object.keys(shiftData).forEach((day) => {
        shiftData[day as keyof ShiftData].morning = true;
        shiftData[day as keyof ShiftData].afternoon = true;
        shiftData[day as keyof ShiftData].evening = true;
      });
      const report = getComplianceReport(shiftData);

      expect(report.compliant).toBe(false);
      expect(report.withinMaximumHours).toBe(false);
      expect(report.meetsMinimumShifts).toBe(true);
      expect(report.meetsMinimumHours).toBe(true);
    });
  });

  describe('getScheduleGaps', () => {
    it('identifies no gaps for daily shifts', () => {
      const shiftData = emptyShiftData();
      Object.keys(shiftData).forEach((day) => {
        shiftData[day as keyof ShiftData].morning = true;
      });
      const gaps = getScheduleGaps(shiftData);

      expect(gaps.unselectedDays.length).toBe(0);
      expect(gaps.daysCovered).toBe(7);
    });

    it('identifies unselected days', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.wednesday.morning = true;
      shiftData.friday.morning = true;
      const gaps = getScheduleGaps(shiftData);

      expect(gaps.daysCovered).toBe(3);
      expect(gaps.unselectedDays.length).toBe(4);
      expect(gaps.unselectedDays).toContain('tuesday');
      expect(gaps.unselectedDays).toContain('thursday');
    });

    it('identifies all days as unselected for empty schedule', () => {
      const shiftData = emptyShiftData();
      const gaps = getScheduleGaps(shiftData);

      expect(gaps.unselectedDays.length).toBe(7);
      expect(gaps.daysCovered).toBe(0);
    });
  });

  describe('getScheduleBalance', () => {
    it('calculates zero averages for empty schedule', () => {
      const shiftData = emptyShiftData();
      const balance = getScheduleBalance(shiftData);

      expect(balance.averageHoursPerDay).toBe(0);
      expect(balance.averageHoursPerShift).toBe(0);
      expect(Object.keys(balance.distribution).length).toBe(0);
    });

    it('calculates correct averages for single day three shifts', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      shiftData.monday.evening = true;
      const balance = getScheduleBalance(shiftData);

      expect(balance.averageHoursPerDay).toBe(12);
      expect(balance.averageHoursPerShift).toBe(4);
      expect(balance.distribution.monday).toBe(12);
    });

    it('calculates correct averages for distributed schedule', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      shiftData.tuesday.evening = true;
      shiftData.wednesday.morning = true;
      const balance = getScheduleBalance(shiftData);

      expect(balance.averageHoursPerDay).toBeCloseTo(5.333, 2);
      expect(balance.averageHoursPerShift).toBe(4);
      expect(Object.keys(balance.distribution).length).toBe(3);
    });

    it('correctly handles weekend evening variation in distribution', () => {
      const shiftData = emptyShiftData();
      shiftData.friday.morning = true;
      shiftData.friday.evening = true;
      shiftData.saturday.afternoon = true;
      shiftData.saturday.evening = true;
      const balance = getScheduleBalance(shiftData);

      expect(balance.distribution.friday).toBe(9.5);
      expect(balance.distribution.saturday).toBe(9.5);
      expect(balance.averageHoursPerDay).toBe(9.5);
    });
  });

  describe('getConstraintStatus', () => {
    it('returns non-compliant status for empty schedule', () => {
      const shiftData = emptyShiftData();
      const status = getConstraintStatus(shiftData);

      expect(status.shiftCountStatus).toBe('below');
      expect(status.hoursStatus).toBe('below');
      expect(status.overallStatus).toBe('non-compliant');
    });

    it('returns compliant status for valid schedule', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      const status = getConstraintStatus(shiftData);

      expect(status.shiftCountStatus).toBe('meets');
      expect(status.hoursStatus).toBe('meets');
      expect(status.overallStatus).toBe('compliant');
    });

    it('returns over-scheduled status for >40 hour schedule', () => {
      const shiftData = emptyShiftData();
      Object.keys(shiftData).forEach((day) => {
        shiftData[day as keyof ShiftData].morning = true;
        shiftData[day as keyof ShiftData].afternoon = true;
        shiftData[day as keyof ShiftData].evening = true;
      });
      const status = getConstraintStatus(shiftData);

      expect(status.hoursStatus).toBe('exceeds');
      expect(status.overallStatus).toBe('over-scheduled');
    });

    it('returns exceeds status for shift count when >2 shifts', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      shiftData.monday.evening = true;
      const status = getConstraintStatus(shiftData);

      expect(status.shiftCountStatus).toBe('exceeds');
      expect(status.hoursStatus).toBe('meets');
    });
  });

  describe('Edge Cases: Weekend Transitions & Partial Shifts', () => {
    it('correctly sums mixed weekday and weekend evening shifts', () => {
      const shiftData = emptyShiftData();
      shiftData.tuesday.evening = true; // 4h
      shiftData.wednesday.evening = true; // 4h
      shiftData.thursday.evening = true; // 4h
      shiftData.friday.evening = true; // 5.5h
      shiftData.saturday.evening = true; // 5.5h
      shiftData.sunday.evening = true; // 4h
      const metrics = calculateScheduleMetrics(shiftData);

      expect(metrics.totalHours).toBe(27);
      expect(metrics.shiftCount).toBe(6);
    });

    it('validates schedule with only weekend shifts', () => {
      const shiftData = emptyShiftData();
      shiftData.friday.morning = true; // 4h
      shiftData.friday.afternoon = true; // 4h
      shiftData.saturday.morning = true; // 4h
      shiftData.saturday.afternoon = true; // 4h
      shiftData.sunday.morning = true; // 4h
      const validation = validateEmployeeSchedule(shiftData);

      expect(validation.isValid).toBe(true);
      expect(validation.totalHours).toBe(20);
      expect(validation.shiftCount).toBe(5);
    });

    it('handles Friday-Saturday evening transition with exact variation', () => {
      const shiftData = emptyShiftData();
      shiftData.thursday.evening = true; // 4h (closes 9PM)
      shiftData.friday.evening = true; // 5.5h (closes 10:30PM)
      shiftData.saturday.evening = true; // 5.5h (closes 10:30PM)
      const metrics = calculateScheduleMetrics(shiftData);

      expect(metrics.totalHours).toBe(15);
      expect(metrics.shiftCount).toBe(3);
    });

    it('validates minimum with one weekend evening and one morning', () => {
      const shiftData = emptyShiftData();
      shiftData.friday.evening = true; // 5.5h
      shiftData.monday.morning = true; // 4h
      const validation = validateEmployeeSchedule(shiftData);

      expect(validation.isValid).toBe(true);
      expect(validation.totalHours).toBe(9.5);
      expect(validation.shiftCount).toBe(2);
    });

    it('calculates distribution with partial weeks', () => {
      const shiftData = emptyShiftData();
      shiftData.friday.morning = true;
      shiftData.friday.afternoon = true;
      shiftData.saturday.evening = true;
      const balance = getScheduleBalance(shiftData);

      expect(balance.distribution.friday).toBe(8);
      expect(balance.distribution.saturday).toBe(5.5);
      expect(balance.averageHoursPerDay).toBeCloseTo(6.75, 1);
    });
  });

  describe('Error Message Clarity', () => {
    it('includes current shift count in error message', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      const validation = validateEmployeeSchedule(shiftData);

      const shiftError = validation.errors.find((e) => e.code === 'INSUFFICIENT_SHIFTS');
      expect(shiftError?.message).toContain('currently 1');
    });

    it('includes current hours in error message', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      const validation = validateEmployeeSchedule(shiftData);

      const hoursError = validation.errors.find((e) => e.code === 'INSUFFICIENT_HOURS');
      expect(hoursError?.message).toContain('currently 4');
    });

    it('includes current hours for exceeds error', () => {
      const shiftData = emptyShiftData();
      Object.keys(shiftData).forEach((day) => {
        shiftData[day as keyof ShiftData].morning = true;
        shiftData[day as keyof ShiftData].afternoon = true;
        shiftData[day as keyof ShiftData].evening = true;
      });
      const validation = validateEmployeeSchedule(shiftData);

      const exceedsError = validation.errors.find((e) => e.code === 'EXCEEDS_MAXIMUM');
      expect(exceedsError?.message).toContain('87');
    });
  });
});
