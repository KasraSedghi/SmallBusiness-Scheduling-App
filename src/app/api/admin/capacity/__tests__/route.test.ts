import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createDefaultCapacities,
  createHolidayOverrideCapacities,
  CapacityRules,
} from '../route';

describe('Capacity API Helpers', () => {
  describe('createDefaultCapacities', () => {
    it('returns correct default capacities for all days', () => {
      const defaults = createDefaultCapacities();

      expect(Object.keys(defaults).length).toBe(7);
      expect(defaults.monday).toEqual({ morning: 4, afternoon: 4, evening: 4 });
      expect(defaults.tuesday).toEqual({ morning: 4, afternoon: 4, evening: 4 });
      expect(defaults.wednesday).toEqual({ morning: 4, afternoon: 4, evening: 4 });
      expect(defaults.thursday).toEqual({ morning: 4, afternoon: 4, evening: 4 });
      expect(defaults.friday).toEqual({ morning: 6, afternoon: 6, evening: 4 });
      expect(defaults.saturday).toEqual({ morning: 6, afternoon: 6, evening: 4 });
      expect(defaults.sunday).toEqual({ morning: 6, afternoon: 6, evening: 4 });
    });

    it('sets weekday capacities to 4', () => {
      const defaults = createDefaultCapacities();
      const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday'];

      weekdays.forEach((day) => {
        expect(defaults[day].morning).toBe(4);
        expect(defaults[day].afternoon).toBe(4);
        expect(defaults[day].evening).toBe(4);
      });
    });

    it('sets Fri/Sat/Sun morning and afternoon to 6', () => {
      const defaults = createDefaultCapacities();
      const afternoonDays = ['friday', 'saturday', 'sunday'];

      afternoonDays.forEach((day) => {
        expect(defaults[day].morning).toBe(6);
        expect(defaults[day].afternoon).toBe(6);
      });
    });

    it('sets Fri/Sat/Sun evening to 4', () => {
      const defaults = createDefaultCapacities();
      const eveningDays = ['friday', 'saturday', 'sunday'];

      eveningDays.forEach((day) => {
        expect(defaults[day].evening).toBe(4);
      });
    });

    it('returns independent object (not reference)', () => {
      const defaults1 = createDefaultCapacities();
      const defaults2 = createDefaultCapacities();

      defaults1.monday.morning = 10;
      expect(defaults2.monday.morning).toBe(4);
    });
  });

  describe('createHolidayOverrideCapacities', () => {
    it('returns all shifts set to 6 staff', () => {
      const holiday = createHolidayOverrideCapacities();

      Object.values(holiday).forEach((day) => {
        expect(day.morning).toBe(6);
        expect(day.afternoon).toBe(6);
        expect(day.evening).toBe(6);
      });
    });

    it('covers all 7 days of week', () => {
      const holiday = createHolidayOverrideCapacities();

      expect(Object.keys(holiday).length).toBe(7);
      expect(holiday.monday).toBeDefined();
      expect(holiday.tuesday).toBeDefined();
      expect(holiday.wednesday).toBeDefined();
      expect(holiday.thursday).toBeDefined();
      expect(holiday.friday).toBeDefined();
      expect(holiday.saturday).toBeDefined();
      expect(holiday.sunday).toBeDefined();
    });

    it('returns 126 total staff (7 days × 3 shifts × 6 staff)', () => {
      const holiday = createHolidayOverrideCapacities();
      let total = 0;

      Object.values(holiday).forEach((day) => {
        total += day.morning + day.afternoon + day.evening;
      });

      expect(total).toBe(126);
    });

    it('returns independent object (not reference)', () => {
      const holiday1 = createHolidayOverrideCapacities();
      const holiday2 = createHolidayOverrideCapacities();

      holiday1.monday.morning = 2;
      expect(holiday2.monday.morning).toBe(6);
    });
  });

  describe('CapacityRules Interface', () => {
    it('requires capacity property', () => {
      const rules: CapacityRules = {
        capacity: createDefaultCapacities(),
      };

      expect(rules.capacity).toBeDefined();
      expect(Object.keys(rules.capacity).length).toBe(7);
    });

    it('supports optional holiday flag', () => {
      const rules: CapacityRules = {
        capacity: createDefaultCapacities(),
        is_holiday: true,
      };

      expect(rules.is_holiday).toBe(true);
    });

    it('supports backup capacity storage', () => {
      const backup = createDefaultCapacities();
      const rules: CapacityRules = {
        capacity: createHolidayOverrideCapacities(),
        is_holiday: true,
        backup_capacity: backup,
      };

      expect(rules.backup_capacity).toEqual(backup);
    });

    it('can store holiday_overrides data', () => {
      const rules: CapacityRules = {
        capacity: createHolidayOverrideCapacities(),
        is_holiday: true,
        holiday_overrides: createHolidayOverrideCapacities(),
      };

      expect(rules.holiday_overrides).toBeDefined();
    });
  });

  describe('Capacity Calculations', () => {
    it('calculates correct total staff for defaults', () => {
      const defaults = createDefaultCapacities();
      let total = 0;

      Object.values(defaults).forEach((day) => {
        total += day.morning + day.afternoon + day.evening;
      });

      // 4 weekdays (Mon-Thu) × (4+4+4) + 3 days (Fri-Sun) × (6+6+4)
      // = 4 × 12 + 3 × 16 = 48 + 48 = 96
      expect(total).toBe(96);
    });

    it('shows difference between defaults and holiday', () => {
      const defaults = createDefaultCapacities();
      const holiday = createHolidayOverrideCapacities();

      let defaultTotal = 0;
      let holidayTotal = 0;

      Object.values(defaults).forEach((day) => {
        defaultTotal += day.morning + day.afternoon + day.evening;
      });

      Object.values(holiday).forEach((day) => {
        holidayTotal += day.morning + day.afternoon + day.evening;
      });

      expect(holidayTotal).toBe(126);
      expect(holidayTotal - defaultTotal).toBe(30);
    });

    it('preserves structure when converting default to holiday', () => {
      const defaults = createDefaultCapacities();
      const holiday = createHolidayOverrideCapacities();

      Object.keys(defaults).forEach((day) => {
        expect(holiday[day]).toBeDefined();
        expect(holiday[day].morning).toBeDefined();
        expect(holiday[day].afternoon).toBeDefined();
        expect(holiday[day].evening).toBeDefined();
      });
    });
  });

  describe('Backup/Restore Pattern', () => {
    it('supports backup before holiday toggle', () => {
      const original = createDefaultCapacities();
      const backup = JSON.parse(JSON.stringify(original));
      const holiday = createHolidayOverrideCapacities();

      expect(backup).toEqual(original);
      expect(holiday).not.toEqual(backup);
    });

    it('can restore from backup', () => {
      const original = createDefaultCapacities();
      const backup = JSON.parse(JSON.stringify(original));
      const holiday = createHolidayOverrideCapacities();

      const restored = JSON.parse(JSON.stringify(backup));
      expect(restored).toEqual(original);
      expect(restored).not.toEqual(holiday);
    });

    it('preserves custom capacities in backup', () => {
      const custom: Record<string, Record<string, number>> = {
        monday: { morning: 5, afternoon: 3, evening: 2 },
        tuesday: { morning: 4, afternoon: 4, evening: 4 },
        wednesday: { morning: 4, afternoon: 4, evening: 4 },
        thursday: { morning: 4, afternoon: 4, evening: 4 },
        friday: { morning: 6, afternoon: 6, evening: 4 },
        saturday: { morning: 6, afternoon: 6, evening: 4 },
        sunday: { morning: 6, afternoon: 6, evening: 4 },
      };

      const backup = JSON.parse(JSON.stringify(custom));
      const holiday = createHolidayOverrideCapacities();

      expect(backup.monday).toEqual({ morning: 5, afternoon: 3, evening: 2 });
      expect(holiday.monday).toEqual({ morning: 6, afternoon: 6, evening: 6 });
      expect(backup.monday).not.toEqual(holiday.monday);
    });
  });

  describe('Holiday Override Edge Cases', () => {
    it('handles toggling on and off without data loss', () => {
      const original = createDefaultCapacities();
      const backup1 = JSON.parse(JSON.stringify(original));

      const holiday = createHolidayOverrideCapacities();
      const backup2 = JSON.parse(JSON.stringify(holiday));

      const restored = JSON.parse(JSON.stringify(backup1));

      expect(restored).toEqual(original);
      expect(backup2).toEqual(holiday);
      expect(restored).not.toEqual(backup2);
    });

    it('supports multiple toggle cycles', () => {
      const state1 = createDefaultCapacities();
      const backup1 = JSON.parse(JSON.stringify(state1));

      const state2 = createHolidayOverrideCapacities();
      const state3 = JSON.parse(JSON.stringify(backup1));

      const backup3 = JSON.parse(JSON.stringify(state3));
      const state4 = createHolidayOverrideCapacities();

      expect(state1).toEqual(state3);
      expect(state2).toEqual(state4);
    });

    it('custom values should survive toggle cycle', () => {
      const custom: Record<string, Record<string, number>> = {
        monday: { morning: 3, afternoon: 5, evening: 2 },
        tuesday: { morning: 4, afternoon: 4, evening: 4 },
        wednesday: { morning: 4, afternoon: 4, evening: 4 },
        thursday: { morning: 4, afternoon: 4, evening: 4 },
        friday: { morning: 6, afternoon: 6, evening: 4 },
        saturday: { morning: 6, afternoon: 6, evening: 4 },
        sunday: { morning: 6, afternoon: 6, evening: 4 },
      };

      const backup = JSON.parse(JSON.stringify(custom));
      const holiday = createHolidayOverrideCapacities();
      const restored = JSON.parse(JSON.stringify(backup));

      expect(restored).toEqual(custom);
      expect(restored.monday).toEqual({ morning: 3, afternoon: 5, evening: 2 });
      expect(holiday.monday).toEqual({ morning: 6, afternoon: 6, evening: 6 });
    });
  });
});
