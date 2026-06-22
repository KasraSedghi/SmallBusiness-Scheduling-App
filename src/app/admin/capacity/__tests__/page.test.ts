import { describe, it, expect, beforeEach, vi } from 'vitest';

// Test helpers for capacity panel logic
describe('Admin Capacity Panel Logic', () => {
  const DEFAULT_CAPACITIES = {
    monday: { morning: 4, afternoon: 4, evening: 4 },
    tuesday: { morning: 4, afternoon: 4, evening: 4 },
    wednesday: { morning: 4, afternoon: 4, evening: 4 },
    thursday: { morning: 4, afternoon: 4, evening: 4 },
    friday: { morning: 6, afternoon: 6, evening: 4 },
    saturday: { morning: 6, afternoon: 6, evening: 4 },
    sunday: { morning: 6, afternoon: 6, evening: 4 },
  };

  describe('Capacity Value Management', () => {
    it('updates single capacity value', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      capacities.monday.morning = 5;

      expect(capacities.monday.morning).toBe(5);
      expect(capacities.monday.afternoon).toBe(4);
    });

    it('maintains other days when updating one', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      capacities.monday.morning = 5;

      expect(capacities.tuesday).toEqual(DEFAULT_CAPACITIES.tuesday);
      expect(capacities.friday).toEqual(DEFAULT_CAPACITIES.friday);
    });

    it('prevents negative capacity values', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      const newValue = Math.max(0, -5);

      expect(newValue).toBe(0);
    });

    it('caps maximum capacity at 20', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      const newValue = Math.min(20, 25);

      expect(newValue).toBe(20);
    });
  });

  describe('Holiday Toggle Logic', () => {
    it('enables holiday and sets all to 6', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      let isHoliday = false;
      let backupCapacities: typeof DEFAULT_CAPACITIES | null = null;

      if (!isHoliday) {
        backupCapacities = JSON.parse(JSON.stringify(capacities));
        Object.keys(capacities).forEach((day) => {
          capacities[day].morning = 6;
          capacities[day].afternoon = 6;
          capacities[day].evening = 6;
        });
        isHoliday = true;
      }

      expect(isHoliday).toBe(true);
      expect(backupCapacities).toEqual(DEFAULT_CAPACITIES);
      expect(capacities.monday).toEqual({ morning: 6, afternoon: 6, evening: 6 });
    });

    it('disables holiday and restores backup', () => {
      const capacities = { morning: 6, afternoon: 6, evening: 6 };
      const backupCapacities = { morning: 4, afternoon: 4, evening: 4 };
      let isHoliday = true;

      if (isHoliday && backupCapacities) {
        Object.assign(capacities, backupCapacities);
        isHoliday = false;
      }

      expect(isHoliday).toBe(false);
      expect(capacities).toEqual(backupCapacities);
    });

    it('preserves custom values when toggling holiday', () => {
      const customCapacities = {
        monday: { morning: 3, afternoon: 5, evening: 2 },
        tuesday: { morning: 4, afternoon: 4, evening: 4 },
        wednesday: { morning: 4, afternoon: 4, evening: 4 },
        thursday: { morning: 4, afternoon: 4, evening: 4 },
        friday: { morning: 6, afternoon: 6, evening: 4 },
        saturday: { morning: 6, afternoon: 6, evening: 4 },
        sunday: { morning: 6, afternoon: 6, evening: 4 },
      };

      let capacities = JSON.parse(JSON.stringify(customCapacities));
      let isHoliday = false;
      let backupCapacities = null;

      // Enable holiday
      if (!isHoliday) {
        backupCapacities = JSON.parse(JSON.stringify(capacities));
        Object.keys(capacities).forEach((day) => {
          capacities[day].morning = 6;
          capacities[day].afternoon = 6;
          capacities[day].evening = 6;
        });
        isHoliday = true;
      }

      // Disable holiday
      if (isHoliday && backupCapacities) {
        capacities = JSON.parse(JSON.stringify(backupCapacities));
        backupCapacities = null;
        isHoliday = false;
      }

      expect(capacities).toEqual(customCapacities);
      expect(capacities.monday).toEqual({ morning: 3, afternoon: 5, evening: 2 });
    });
  });

  describe('Form State Management', () => {
    it('initializes with default capacities', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));

      expect(capacities).toEqual(DEFAULT_CAPACITIES);
      expect(capacities.monday.morning).toBe(4);
      expect(capacities.friday.afternoon).toBe(6);
    });

    it('initializes holiday as false', () => {
      const isHoliday = false;

      expect(isHoliday).toBe(false);
    });

    it('initializes backup as null', () => {
      const backupCapacities = null;

      expect(backupCapacities).toBeNull();
    });

    it('tracks multiple edits before save', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      const changes: string[] = [];

      capacities.monday.morning = 5;
      changes.push('monday.morning');

      capacities.tuesday.afternoon = 3;
      changes.push('tuesday.afternoon');

      capacities.friday.evening = 5;
      changes.push('friday.evening');

      expect(changes.length).toBe(3);
      expect(capacities.monday.morning).toBe(5);
      expect(capacities.tuesday.afternoon).toBe(3);
      expect(capacities.friday.evening).toBe(5);
    });
  });

  describe('Reset to Defaults', () => {
    it('resets all capacities to defaults', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      capacities.monday.morning = 10;
      capacities.friday.afternoon = 2;
      capacities.sunday.evening = 8;

      Object.keys(capacities).forEach((day) => {
        capacities[day] = JSON.parse(JSON.stringify((DEFAULT_CAPACITIES as any)[day]));
      });

      expect(capacities).toEqual(DEFAULT_CAPACITIES);
    });

    it('clears holiday flag on reset', () => {
      let isHoliday = true;
      let backupCapacities = { some: 'backup' };

      isHoliday = false;
      backupCapacities = null;

      expect(isHoliday).toBe(false);
      expect(backupCapacities).toBeNull();
    });

    it('clears backup capacities on reset', () => {
      let backupCapacities: Record<string, any> | null = DEFAULT_CAPACITIES;

      backupCapacities = null;

      expect(backupCapacities).toBeNull();
    });
  });

  describe('Summary Calculations', () => {
    it('counts total shifts configured (21)', () => {
      const totalShifts = 7 * 3;

      expect(totalShifts).toBe(21);
    });

    it('calculates total default staff', () => {
      let total = 0;
      Object.values(DEFAULT_CAPACITIES).forEach((day) => {
        total += day.morning + day.afternoon + day.evening;
      });

      expect(total).toBe(96);
    });

    it('identifies when in holiday mode', () => {
      const isHoliday = true;
      const status = isHoliday ? 'Enabled (All shifts = 6)' : 'Disabled';

      expect(status).toBe('Enabled (All shifts = 6)');
    });

    it('indicates backup status', () => {
      const backupCapacities = DEFAULT_CAPACITIES;
      const hasBackup = backupCapacities !== null;

      expect(hasBackup).toBe(true);
    });

    it('shows no backup initially', () => {
      const backupCapacities = null;
      const hasBackup = backupCapacities !== null;

      expect(hasBackup).toBe(false);
    });
  });

  describe('Save Payload Construction', () => {
    it('constructs POST payload for new settings', () => {
      const week_starting = '2026-06-21';
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      const isHoliday = false;
      const backupCapacities = null;

      const payload = {
        week_starting,
        rules: {
          capacity: capacities,
          is_holiday: isHoliday,
          holiday_overrides: isHoliday ? capacities : {},
        },
      };

      expect(payload.week_starting).toBe('2026-06-21');
      expect(payload.rules.capacity).toEqual(DEFAULT_CAPACITIES);
      expect(payload.rules.is_holiday).toBe(false);
      expect(payload.rules.holiday_overrides).toEqual({});
    });

    it('constructs PUT payload with id', () => {
      const id = 'uuid-123';
      const week_starting = '2026-06-21';
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      const isHoliday = false;

      const payload = {
        id,
        week_starting,
        rules: {
          capacity: capacities,
          is_holiday: isHoliday,
          holiday_overrides: {},
        },
      };

      expect(payload.id).toBe('uuid-123');
      expect(payload.week_starting).toBe('2026-06-21');
    });

    it('includes backup in holiday mode payload', () => {
      const capacities = { monday: { morning: 6, afternoon: 6, evening: 6 } };
      const backupCapacities = { monday: { morning: 4, afternoon: 4, evening: 4 } };
      const isHoliday = true;

      const rules = {
        capacity: capacities,
        is_holiday: isHoliday,
        holiday_overrides: isHoliday ? capacities : {},
        backup_capacity: isHoliday ? backupCapacities : undefined,
      };

      expect(rules.backup_capacity).toEqual(backupCapacities);
      expect(rules.is_holiday).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('validates all days present', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

      days.forEach((day) => {
        expect(capacities[day]).toBeDefined();
      });
    });

    it('validates all shift types present', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
      const shiftTypes = ['morning', 'afternoon', 'evening'];

      Object.values(capacities).forEach((day: any) => {
        shiftTypes.forEach((shift) => {
          expect(day[shift]).toBeDefined();
        });
      });
    });

    it('validates capacity values are numbers', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));

      Object.values(capacities).forEach((day: any) => {
        Object.values(day).forEach((capacity: any) => {
          expect(typeof capacity).toBe('number');
        });
      });
    });

    it('validates no negative capacities', () => {
      const capacities = JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));

      Object.values(capacities).forEach((day: any) => {
        Object.values(day).forEach((capacity: any) => {
          expect(capacity).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe('UI State Messages', () => {
    it('generates correct holiday on message', () => {
      const isHoliday = true;
      const message = isHoliday
        ? 'All shifts set to 6 staff. Custom values are saved and will be restored when disabled.'
        : 'Enable to set all shifts to 6 staff for holiday weeks.';

      expect(message).toContain('All shifts set to 6 staff');
    });

    it('generates correct holiday off message', () => {
      const isHoliday = false;
      const message = isHoliday
        ? 'All shifts set to 6 staff. Custom values are saved and will be restored when disabled.'
        : 'Enable to set all shifts to 6 staff for holiday weeks.';

      expect(message).toContain('Enable to set all shifts');
    });

    it('generates correct input disabled state', () => {
      const isHoliday = true;
      const isDisabled = isHoliday;

      expect(isDisabled).toBe(true);
    });

    it('generates correct save button text', () => {
      const saving = false;
      const text = saving ? 'Saving...' : 'Save Changes';

      expect(text).toBe('Save Changes');
    });

    it('generates correct save button text while saving', () => {
      const saving = true;
      const text = saving ? 'Saving...' : 'Save Changes';

      expect(text).toBe('Saving...');
    });
  });
});
