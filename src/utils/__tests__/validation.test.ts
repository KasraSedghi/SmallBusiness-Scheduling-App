import { describe, it, expect } from 'vitest';
import { validatePassword, validateSchedule } from '../validation';

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

  describe('edge cases', () => {
    it('handles null hours in shift objects', () => {
      const shifts = [{ hours: 4 }, { hours: 4 }];
      const result = validateSchedule(shifts, 8);
      expect(result.isValid).toBe(true);
    });

    it('handles very high hour counts', () => {
      const shifts = [{ hours: 100 }, { hours: 100 }];
      const result = validateSchedule(shifts, 200);
      expect(result.isValid).toBe(true);
    });

    it('rejects negative hours count', () => {
      const shifts = [{ hours: 4 }, { hours: 4 }];
      const result = validateSchedule(shifts, -1);
      expect(result.isValid).toBe(false);
    });

    it('handles fractional hours', () => {
      const shifts = [{ hours: 4.5 }, { hours: 4.5 }];
      const result = validateSchedule(shifts, 9);
      expect(result.isValid).toBe(true);
    });
  });
});
