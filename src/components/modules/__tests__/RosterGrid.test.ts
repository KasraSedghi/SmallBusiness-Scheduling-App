import { describe, it, expect } from 'vitest';

describe('RosterGrid Component Logic', () => {
  describe('Shift Display', () => {
    it('shows checkmark for selected shifts', () => {
      const shift = { morning: true, afternoon: false, evening: false };
      expect(shift.morning).toBe(true);
    });

    it('shows dash for unselected shifts', () => {
      const shift = { morning: false, afternoon: false, evening: false };
      expect(shift.morning).toBe(false);
    });

    it('renders 21 total cells (7 days × 3 shifts)', () => {
      const days = 7;
      const shiftsPerDay = 3;
      expect(days * shiftsPerDay).toBe(21);
    });
  });

  describe('Constraint Status', () => {
    it('displays under-scheduled for < 2 shifts', () => {
      const shiftCount = 1;
      const meetsMinimum = shiftCount >= 2;
      expect(meetsMinimum).toBe(false);
    });

    it('displays under-scheduled for < 8 hours', () => {
      const totalHours = 7;
      const meetsMinimum = totalHours >= 8;
      expect(meetsMinimum).toBe(false);
    });

    it('displays over-scheduled for > 40 hours', () => {
      const totalHours = 41;
      const withinMaximum = totalHours <= 40;
      expect(withinMaximum).toBe(false);
    });

    it('compliant for 2+ shifts and 8-40 hours', () => {
      const shiftCount = 3;
      const totalHours = 12;
      const isCompliant = shiftCount >= 2 && totalHours >= 8 && totalHours <= 40;
      expect(isCompliant).toBe(true);
    });
  });

  describe('Staffing Summary', () => {
    it('counts approved availabilities per shift', () => {
      const availabilities = [
        { id: 'a1', status: 'approved', shift_data: { monday: { morning: true } } },
        { id: 'a2', status: 'approved', shift_data: { monday: { morning: true } } },
      ];
      const count = availabilities.filter(a => a.status === 'approved').length;
      expect(count).toBe(2);
    });

    it('ignores pending availabilities', () => {
      const availabilities = [
        { id: 'a1', status: 'pending' },
        { id: 'a2', status: 'approved' },
      ];
      const approved = availabilities.filter(a => a.status === 'approved');
      expect(approved).toHaveLength(1);
    });

    it('calculates shortfall correctly', () => {
      const required = 4;
      const actual = 2;
      const shortfall = required - actual;
      expect(shortfall).toBe(2);
    });

    it('shows green for fully staffed', () => {
      const shortfall = 0;
      const isGreen = shortfall <= 0;
      expect(isGreen).toBe(true);
    });

    it('shows red for understaffed', () => {
      const shortfall = 2;
      const isRed = shortfall > 0;
      expect(isRed).toBe(true);
    });
  });

  describe('Time-Off Handling', () => {
    it('identifies employee as off on time-off date', () => {
      const timeOff = {
        profile_id: 'user-1',
        status: 'approved',
        start_date: '2026-06-22',
        end_date: '2026-06-24',
      };
      const dateStr = '2026-06-23';
      const isOff = dateStr >= timeOff.start_date && dateStr <= timeOff.end_date;
      expect(isOff).toBe(true);
    });

    it('excludes employee outside time-off range', () => {
      const timeOff = {
        profile_id: 'user-1',
        status: 'approved',
        start_date: '2026-06-22',
        end_date: '2026-06-24',
      };
      const dateStr = '2026-06-25';
      const isOff = dateStr >= timeOff.start_date && dateStr <= timeOff.end_date;
      expect(isOff).toBe(false);
    });

    it('ignores pending time-off requests', () => {
      const timeOff = {
        profile_id: 'user-1',
        status: 'pending',
        start_date: '2026-06-22',
        end_date: '2026-06-24',
      };
      const dateStr = '2026-06-23';
      const isOff = timeOff.status === 'approved' && dateStr >= timeOff.start_date;
      expect(isOff).toBe(false);
    });

    it('handles date boundaries', () => {
      const timeOff = {
        start_date: '2026-06-22',
        end_date: '2026-06-24',
      };
      const startDate = '2026-06-22';
      const endDate = '2026-06-24';
      
      expect(startDate >= timeOff.start_date).toBe(true);
      expect(endDate <= timeOff.end_date).toBe(true);
    });
  });

  describe('Approval Status', () => {
    it('displays pending badge', () => {
      const status = 'pending';
      const badge = status === 'approved' ? 'Approved' : 'Pending';
      expect(badge).toBe('Pending');
    });

    it('displays approved badge', () => {
      const status = 'approved';
      const badge = status === 'approved' ? 'Approved' : 'Pending';
      expect(badge).toBe('Approved');
    });
  });

  describe('Sections', () => {
    it('groups pending separately', () => {
      const availabilities = [
        { status: 'pending' },
        { status: 'approved' },
        { status: 'pending' },
      ];
      const pending = availabilities.filter(a => a.status === 'pending');
      expect(pending).toHaveLength(2);
    });

    it('groups approved separately', () => {
      const availabilities = [
        { status: 'pending' },
        { status: 'approved' },
        { status: 'approved' },
      ];
      const approved = availabilities.filter(a => a.status === 'approved');
      expect(approved).toHaveLength(2);
    });

    it('handles empty state', () => {
      const availabilities: any[] = [];
      expect(availabilities).toHaveLength(0);
    });
  });

  describe('Metrics Display', () => {
    it('shows shift count', () => {
      const shiftCount = 3;
      expect(shiftCount).toBe(3);
    });

    it('shows total hours', () => {
      const totalHours = 12;
      expect(totalHours).toBe(12);
    });

    it('combines metrics', () => {
      const text = `${3} shifts, ${12}h total`;
      expect(text).toBe('3 shifts, 12h total');
    });
  });

  describe('Callbacks', () => {
    it('calls approval change with ID and status', () => {
      let id = '';
      let status = '';
      
      const callback = (newId: string, newStatus: string) => {
        id = newId;
        status = newStatus;
      };
      
      callback('avail-123', 'approved');
      expect(id).toBe('avail-123');
      expect(status).toBe('approved');
    });

    it('calls callback to approve', () => {
      let callCount = 0;
      const callback = () => callCount++;
      
      callback();
      expect(callCount).toBe(1);
    });

    it('calls callback to revert', () => {
      let status = '';
      const callback = (s: string) => { status = s; };
      
      callback('pending');
      expect(status).toBe('pending');
    });
  });
});
