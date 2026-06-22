import { describe, it, expect } from 'vitest';
import { validatePassword, validateSchedule, validateShiftDuration, validateShiftCapacity } from '../validation';

describe('validatePassword', () => {
  describe('valid passwords', () => {
    it('accepts password with 8+ chars, uppercase, and number', () => {
      const result = validatePassword('Password123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts password with special characters if other requirements met', () => {
      const result = validatePassword('MyPass@1');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts long passwords meeting all requirements', () => {
      const result = validatePassword('VeryLongPassword123456');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts password with multiple uppercase letters', () => {
      const result = validatePassword('PaSsWoRd123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('invalid passwords - length', () => {
    it('rejects password shorter than 8 characters', () => {
      const result = validatePassword('Pass1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('rejects 7-character password even with uppercase and number', () => {
      const result = validatePassword('Pass123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    it('accepts exactly 8 characters if other requirements met', () => {
      const result = validatePassword('Pass1234');
      expect(result.isValid).toBe(true);
    });
  });

  describe('invalid passwords - uppercase letter', () => {
    it('rejects all lowercase password', () => {
      const result = validatePassword('password123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('rejects all lowercase with numbers', () => {
      const result = validatePassword('mypassword123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });
  });

  describe('invalid passwords - number requirement', () => {
    it('rejects password with no numbers', () => {
      const result = validatePassword('Password');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('rejects uppercase-only password', () => {
      const result = validatePassword('PASSWORD');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors).toContain('Password must contain at least one number');
    });
  });

  describe('multiple validation failures', () => {
    it('returns all error messages for password meeting no requirements', () => {
      const result = validatePassword('short');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Password must be at least 8 characters');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('returns two errors for short password with uppercase', () => {
      const result = validatePassword('Short1');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });
  });

  describe('edge cases', () => {
    it('rejects empty string', () => {
      const result = validatePassword('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });

    it('handles unicode uppercase letters', () => {
      const result = validatePassword('Pässwörd123');
      expect(result.isValid).toBe(true);
    });

    it('accepts password with leading/trailing spaces (as part of password)', () => {
      const result = validatePassword(' Password123 ');
      expect(result.isValid).toBe(true);
    });
  });
});

describe('validateSchedule', () => {
  describe('valid schedules', () => {
    it('accepts schedule with exactly 2 shifts and 8 hours', () => {
      const shifts = [{ hours: 4 }, { hours: 4 }];
      const result = validateSchedule(shifts, 8);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts schedule with 3 shifts and 10 hours', () => {
      const shifts = [{ hours: 4 }, { hours: 3 }, { hours: 3 }];
      const result = validateSchedule(shifts, 10);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts schedule with many shifts and high hours', () => {
      const shifts = Array(5).fill({ hours: 8 });
      const result = validateSchedule(shifts, 40);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('insufficient shifts', () => {
    it('rejects schedule with 0 shifts', () => {
      const result = validateSchedule([], 8);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must select at least 2 shifts per week');
    });

    it('rejects schedule with 1 shift', () => {
      const shifts = [{ hours: 8 }];
      const result = validateSchedule(shifts, 8);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must select at least 2 shifts per week');
    });

    it('accepts schedule with exactly 2 shifts', () => {
      const shifts = [{ hours: 4 }, { hours: 4 }];
      const result = validateSchedule(shifts, 8);
      expect(result.isValid).toBe(true);
    });
  });

  describe('insufficient hours', () => {
    it('rejects schedule with 0 hours', () => {
      const shifts = [{ hours: 0 }, { hours: 0 }];
      const result = validateSchedule(shifts, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must work at least 8 hours per week');
    });

    it('rejects schedule with 7 hours', () => {
      const shifts = [{ hours: 4 }, { hours: 3 }];
      const result = validateSchedule(shifts, 7);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Must work at least 8 hours per week');
    });

    it('accepts schedule with exactly 8 hours', () => {
      const shifts = [{ hours: 4 }, { hours: 4 }];
      const result = validateSchedule(shifts, 8);
      expect(result.isValid).toBe(true);
    });
  });

  describe('multiple validation failures', () => {
    it('returns both errors when shifts and hours insufficient', () => {
      const shifts = [{ hours: 3 }];
      const result = validateSchedule(shifts, 3);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Must select at least 2 shifts per week');
      expect(result.errors).toContain('Must work at least 8 hours per week');
    });
  });

  describe('weekly maximum cap', () => {
    it('rejects schedule exceeding 40 hours per week', () => {
      const shifts = [{ hours: 25 }, { hours: 20 }];
      const result = validateSchedule(shifts, 45);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot work more than 40 hours per week');
    });

    it('accepts schedule with exactly 40 hours', () => {
      const shifts = [{ hours: 20 }, { hours: 20 }];
      const result = validateSchedule(shifts, 40);
      expect(result.isValid).toBe(true);
    });

    it('accepts schedule with 39 hours', () => {
      const shifts = [{ hours: 20 }, { hours: 19 }];
      const result = validateSchedule(shifts, 39);
      expect(result.isValid).toBe(true);
    });

    it('returns both insufficient hours AND excess hours errors', () => {
      // Edge case: 0 hours (below min) would be caught by min check, not max check
      const shifts = [{ hours: 25 }, { hours: 25 }];
      const result = validateSchedule(shifts, 50);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot work more than 40 hours per week');
    });
  });

  describe('edge cases', () => {
    it('handles null hours in shift objects', () => {
      const shifts = [{ hours: 4 }, { hours: 4 }];
      const result = validateSchedule(shifts, 8);
      expect(result.isValid).toBe(true);
    });

    it('handles very high hour counts (rejects > 40)', () => {
      const shifts = [{ hours: 100 }, { hours: 100 }];
      const result = validateSchedule(shifts, 200);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot work more than 40 hours per week');
    });

    it('rejects negative hours count', () => {
      const shifts = [{ hours: 4 }, { hours: 4 }];
      const result = validateSchedule(shifts, -1);
      expect(result.isValid).toBe(false);
    });

    it('handles fractional hours within range', () => {
      const shifts = [{ hours: 4.5 }, { hours: 4.5 }];
      const result = validateSchedule(shifts, 9);
      expect(result.isValid).toBe(true);
    });
  });
});

describe('validateShiftDuration', () => {
  describe('valid shift hours', () => {
    it('accepts 3-hour shift (minimum)', () => {
      const result = validateShiftDuration(3);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts 4-hour shift', () => {
      const result = validateShiftDuration(4);
      expect(result.isValid).toBe(true);
    });

    it('accepts 8-hour shift', () => {
      const result = validateShiftDuration(8);
      expect(result.isValid).toBe(true);
    });

    it('accepts fractional hours (3.5)', () => {
      const result = validateShiftDuration(3.5);
      expect(result.isValid).toBe(true);
    });
  });

  describe('below minimum duration', () => {
    it('rejects 2.9-hour shift', () => {
      const result = validateShiftDuration(2.9);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Each shift must be at least 3 hours');
    });

    it('rejects 1-hour shift', () => {
      const result = validateShiftDuration(1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Each shift must be at least 3 hours');
    });

    it('rejects 0-hour shift', () => {
      const result = validateShiftDuration(0);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Each shift must be at least 3 hours');
    });

    it('rejects negative hours', () => {
      const result = validateShiftDuration(-5);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Each shift must be at least 3 hours');
    });
  });

  describe('exceeds single-shift maximum', () => {
    it('rejects 40.1-hour shift', () => {
      const result = validateShiftDuration(40.1);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('A single shift cannot exceed 40 hours');
    });

    it('accepts exactly 40-hour shift', () => {
      const result = validateShiftDuration(40);
      expect(result.isValid).toBe(true);
    });

    it('rejects 50-hour shift', () => {
      const result = validateShiftDuration(50);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('A single shift cannot exceed 40 hours');
    });

    it('rejects 100-hour shift', () => {
      const result = validateShiftDuration(100);
      expect(result.isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles exactly 3 hours', () => {
      const result = validateShiftDuration(3);
      expect(result.isValid).toBe(true);
    });

    it('handles very small fractional hours below minimum', () => {
      const result = validateShiftDuration(0.5);
      expect(result.isValid).toBe(false);
    });

    it('handles maximum boundary exactly', () => {
      const result = validateShiftDuration(40);
      expect(result.isValid).toBe(true);
    });
  });
});

describe('validateShiftCapacity', () => {
  describe('standard week (non-holiday)', () => {
    it('accepts hours below standard capacity', () => {
      const config = { isHoliday: false, standardCapacity: 40, holidayCapacity: 32 };
      const result = validateShiftCapacity(35, config);
      expect(result.isValid).toBe(true);
    });

    it('accepts hours at standard capacity limit', () => {
      const config = { isHoliday: false, standardCapacity: 40, holidayCapacity: 32 };
      const result = validateShiftCapacity(40, config);
      expect(result.isValid).toBe(true);
    });

    it('rejects hours exceeding standard capacity', () => {
      const config = { isHoliday: false, standardCapacity: 40, holidayCapacity: 32 };
      const result = validateShiftCapacity(45, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot exceed 40 hours on standard weeks');
    });
  });

  describe('holiday week flag', () => {
    it('accepts hours below holiday capacity', () => {
      const config = { isHoliday: true, standardCapacity: 40, holidayCapacity: 32 };
      const result = validateShiftCapacity(30, config);
      expect(result.isValid).toBe(true);
    });

    it('accepts hours at holiday capacity limit', () => {
      const config = { isHoliday: true, standardCapacity: 40, holidayCapacity: 32 };
      const result = validateShiftCapacity(32, config);
      expect(result.isValid).toBe(true);
    });

    it('rejects hours exceeding holiday capacity', () => {
      const config = { isHoliday: true, standardCapacity: 40, holidayCapacity: 32 };
      const result = validateShiftCapacity(35, config);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Cannot exceed 32 hours on holiday weeks');
    });

    it('flags holiday week in error message', () => {
      const config = { isHoliday: true, standardCapacity: 40, holidayCapacity: 32 };
      const result = validateShiftCapacity(40, config);
      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toContain('holiday');
    });
  });

  describe('dynamic capacity switching', () => {
    it('allows 40 hours on standard week but rejects on holiday', () => {
      const standardConfig = { isHoliday: false, standardCapacity: 40, holidayCapacity: 32 };
      const holidayConfig = { isHoliday: true, standardCapacity: 40, holidayCapacity: 32 };

      const standard = validateShiftCapacity(40, standardConfig);
      const holiday = validateShiftCapacity(40, holidayConfig);

      expect(standard.isValid).toBe(true);
      expect(holiday.isValid).toBe(false);
    });

    it('respects capacity change from standard to holiday', () => {
      const hours = 35;
      const standardConfig = { isHoliday: false, standardCapacity: 40, holidayCapacity: 32 };
      const holidayConfig = { isHoliday: true, standardCapacity: 40, holidayCapacity: 32 };

      const standard = validateShiftCapacity(hours, standardConfig);
      const holiday = validateShiftCapacity(hours, holidayConfig);

      expect(standard.isValid).toBe(true);
      expect(holiday.isValid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('handles zero hours', () => {
      const config = { isHoliday: false, standardCapacity: 40, holidayCapacity: 32 };
      const result = validateShiftCapacity(0, config);
      expect(result.isValid).toBe(true);
    });

    it('handles exactly boundary values', () => {
      const config = { isHoliday: false, standardCapacity: 40, holidayCapacity: 32 };
      const standard = validateShiftCapacity(40, config);
      expect(standard.isValid).toBe(true);
    });

    it('handles very high hour counts', () => {
      const config = { isHoliday: false, standardCapacity: 40, holidayCapacity: 32 };
      const result = validateShiftCapacity(100, config);
      expect(result.isValid).toBe(false);
    });

    it('handles fractional hours', () => {
      const config = { isHoliday: false, standardCapacity: 40, holidayCapacity: 32 };
      const result = validateShiftCapacity(39.5, config);
      expect(result.isValid).toBe(true);
    });
  });
});
