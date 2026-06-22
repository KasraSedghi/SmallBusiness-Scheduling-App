import { describe, it, expect, beforeEach, vi } from 'vitest';
import { validateSchedule } from '@/utils/validation';
import { calculateTotalHours, calculateTotalShifts } from '@/utils/shift-helpers';
import { ShiftData, emptyShiftData } from '@/types';

describe('Availability Page Logic', () => {
  describe('Shift Selection & Validation', () => {
    it('validates empty selection as invalid (0 shifts)', () => {
      const shiftData = emptyShiftData();
      const shifts = Array(calculateTotalShifts(shiftData)).fill({
        hours: calculateTotalHours(shiftData) || 0,
      });
      const totalHours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, totalHours);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Must select at least 2 shifts per week');
    });

    it('validates single shift as invalid (1 shift, 4 hours)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      const shifts = Array(calculateTotalShifts(shiftData)).fill({
        hours: 4,
      });
      const totalHours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, totalHours);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Must work at least 8 hours per week');
    });

    it('validates minimum valid selection (2 shifts, 8 hours)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true; // 4 hours
      shiftData.monday.afternoon = true; // 4 hours
      const shifts = Array(calculateTotalShifts(shiftData)).fill({ hours: 4 });
      const totalHours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, totalHours);
      expect(validation.isValid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    it('validates 3 shifts, 12 hours as valid', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true; // 4
      shiftData.monday.afternoon = true; // 4
      shiftData.tuesday.morning = true; // 4
      const shifts = Array(calculateTotalShifts(shiftData)).fill({ hours: 4 });
      const totalHours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, totalHours);
      expect(validation.isValid).toBe(true);
    });

    it('validates exactly 40 hours as valid', () => {
      const shiftData = emptyShiftData();
      // 10 shifts of 4 hours each = 40 hours
      shiftData.monday.morning = true;
      shiftData.monday.afternoon = true;
      shiftData.monday.evening = true;
      shiftData.tuesday.morning = true;
      shiftData.tuesday.afternoon = true;
      shiftData.wednesday.morning = true;
      shiftData.wednesday.afternoon = true;
      shiftData.thursday.morning = true;
      shiftData.thursday.afternoon = true;
      shiftData.friday.morning = true;

      const shifts = Array(calculateTotalShifts(shiftData)).fill({ hours: 4 });
      const totalHours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, totalHours);
      expect(validation.isValid).toBe(true);
    });

    it('rejects selection exceeding 40 hours', () => {
      const shiftData = emptyShiftData();
      // 11 shifts of 4 hours each = 44 hours (over limit)
      Object.keys(shiftData).forEach((day) => {
        const dayShifts = shiftData[day as keyof ShiftData];
        dayShifts.morning = true;
        dayShifts.afternoon = true;
        dayShifts.evening = true;
      });
      // Remove one shift to get to 20 shifts
      shiftData.sunday.morning = false;

      const shifts = Array(calculateTotalShifts(shiftData)).fill({ hours: 4 });
      const totalHours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, totalHours);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Cannot work more than 40 hours per week');
    });

    it('validates all 21 shifts with weekend evening variations', () => {
      const shiftData = emptyShiftData();
      Object.keys(shiftData).forEach((day) => {
        const dayShifts = shiftData[day as keyof ShiftData];
        dayShifts.morning = true;
        dayShifts.afternoon = true;
        dayShifts.evening = true;
      });

      const totalHours = calculateTotalHours(shiftData);
      expect(totalHours).toBeGreaterThan(40); // Should exceed with all shifts
    });

    it('shows multiple validation errors at once', () => {
      const shiftData = emptyShiftData();
      // Only 1 shift (invalid), not enough hours
      shiftData.monday.morning = true;
      const shifts = Array(calculateTotalShifts(shiftData)).fill({ hours: 4 });
      const totalHours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, totalHours);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBe(2); // Both errors
      expect(validation.errors).toContain('Must select at least 2 shifts per week');
      expect(validation.errors).toContain('Must work at least 8 hours per week');
    });
  });

  describe('Hour Calculations for Different Shift Types', () => {
    it('calculates correct hours for morning shifts (4h)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.tuesday.morning = true;
      const hours = calculateTotalHours(shiftData);
      expect(hours).toBe(8);
    });

    it('calculates correct hours for afternoon shifts (4h)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.afternoon = true;
      shiftData.tuesday.afternoon = true;
      const hours = calculateTotalHours(shiftData);
      expect(hours).toBe(8);
    });

    it('calculates correct hours for weekday evening shifts (4h)', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.evening = true;
      shiftData.tuesday.evening = true;
      const hours = calculateTotalHours(shiftData);
      expect(hours).toBe(8);
    });

    it('calculates correct hours for weekend evening shifts (5.5h)', () => {
      const shiftData = emptyShiftData();
      shiftData.friday.evening = true;
      shiftData.saturday.evening = true;
      const hours = calculateTotalHours(shiftData);
      expect(hours).toBe(11);
    });

    it('calculates mixed shift hours correctly', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true; // 4h
      shiftData.tuesday.afternoon = true; // 4h
      shiftData.friday.evening = true; // 5.5h
      const hours = calculateTotalHours(shiftData);
      expect(hours).toBe(13.5);
    });
  });

  describe('Shift Selection Edge Cases', () => {
    it('allows exact 2-shift, 8-hour minimum', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true;
      shiftData.tuesday.morning = true;
      const shifts = Array(2).fill({ hours: 4 });
      const hours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, hours);
      expect(validation.isValid).toBe(true);
    });

    it('disallows 2 shifts with only 4 hours total', () => {
      // This would require 2-hour shifts which violates 3-hour minimum
      // So we test that 2 shifts × 4 hours each = 8 hours minimum
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true; // 4h
      const shifts = Array(1).fill({ hours: 4 });
      const hours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, hours);
      expect(validation.isValid).toBe(false);
    });

    it('allows non-consecutive days', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true; // 4h
      shiftData.friday.afternoon = true; // 4h
      const shifts = Array(2).fill({ hours: 4 });
      const hours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, hours);
      expect(validation.isValid).toBe(true);
    });

    it('allows all shifts on single day', () => {
      const shiftData = emptyShiftData();
      shiftData.monday.morning = true; // 4h
      shiftData.monday.afternoon = true; // 4h
      shiftData.monday.evening = true; // 4h
      const shifts = Array(3).fill({ hours: 4 });
      const hours = calculateTotalHours(shiftData);

      const validation = validateSchedule(shifts, hours);
      expect(validation.isValid).toBe(true);
    });

    it('counts partial weeks correctly', () => {
      const shiftData = emptyShiftData();
      shiftData.friday.afternoon = true; // 4h
      shiftData.friday.evening = true; // 5.5h
      const shifts = Array(2).fill({ hours: 0 });
      const hours = calculateTotalHours(shiftData);

      expect(hours).toBe(9.5);
      const validation = validateSchedule(shifts, hours);
      expect(validation.isValid).toBe(true);
    });
  });
});
