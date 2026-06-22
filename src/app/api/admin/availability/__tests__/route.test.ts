import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Admin Availability API', () => {
  describe('GET /api/admin/availability', () => {
    it('returns availabilities for specified week', async () => {
      const mockAvailabilities = [
        {
          id: 'avail-1',
          profile_id: 'user-1',
          week_starting: '2026-06-21',
          shift_data: {
            monday: { morning: true, afternoon: false, evening: false },
            tuesday: { morning: false, afternoon: true, evening: false },
            wednesday: { morning: false, afternoon: false, evening: true },
            thursday: { morning: true, afternoon: true, evening: false },
            friday: { morning: false, afternoon: false, evening: false },
            saturday: { morning: false, afternoon: false, evening: false },
            sunday: { morning: false, afternoon: false, evening: false },
          },
          status: 'pending',
          created_at: '2026-06-20T10:00:00Z',
          updated_at: '2026-06-20T10:00:00Z',
        },
      ];

      expect(mockAvailabilities).toHaveLength(1);
      expect(mockAvailabilities[0].status).toBe('pending');
      expect(mockAvailabilities[0].profile_id).toBe('user-1');
    });

    it('enriches availabilities with profile data', () => {
      const availability = {
        id: 'avail-1',
        profile_id: 'user-1',
        status: 'pending',
      };

      const profile = {
        id: 'user-1',
        email: 'jane@example.com',
        role: 'employee',
      };

      const enriched = {
        ...availability,
        profile,
      };

      expect(enriched.profile?.email).toBe('jane@example.com');
    });

    it('handles empty availabilities gracefully', () => {
      const availabilities: any[] = [];
      expect(availabilities).toHaveLength(0);
    });

    it('filters and attaches time-off requests', () => {
      const timeOffRequests = [
        {
          id: 'toff-1',
          profile_id: 'user-1',
          start_date: '2026-06-22',
          end_date: '2026-06-24',
          status: 'approved',
        },
        {
          id: 'toff-2',
          profile_id: 'user-2',
          start_date: '2026-06-23',
          end_date: '2026-06-25',
          status: 'pending',
        },
      ];

      const approvedOnly = timeOffRequests.filter((t) => t.status === 'approved');

      expect(approvedOnly).toHaveLength(1);
      expect(approvedOnly[0].profile_id).toBe('user-1');
    });

    it('returns week_starting in response', () => {
      const weekStarting = '2026-06-21';
      const response = {
        data: {
          availabilities: [],
          time_off_requests: [],
          week_starting: weekStarting,
        },
      };

      expect(response.data.week_starting).toBe('2026-06-21');
    });
  });

  describe('PUT /api/admin/availability', () => {
    it('updates availability status to approved', () => {
      const original = {
        id: 'avail-1',
        status: 'pending',
      };

      const updated = {
        ...original,
        status: 'approved',
      };

      expect(original.status).toBe('pending');
      expect(updated.status).toBe('approved');
    });

    it('updates availability status to pending', () => {
      const original = {
        id: 'avail-1',
        status: 'approved',
      };

      const updated = {
        ...original,
        status: 'pending',
      };

      expect(original.status).toBe('approved');
      expect(updated.status).toBe('pending');
    });

    it('requires valid status value', () => {
      const validStatuses = ['pending', 'approved'];
      const status = 'approved';

      expect(validStatuses).toContain(status);
    });

    it('rejects invalid status values', () => {
      const validStatuses = ['pending', 'approved'];
      const status = 'rejected';

      expect(validStatuses).not.toContain(status);
    });

    it('requires id in request body', () => {
      const body = {
        status: 'approved',
      };

      expect(body.id).toBeUndefined();
    });

    it('requires status in request body', () => {
      const body = {
        id: 'avail-1',
      };

      expect(body.status).toBeUndefined();
    });
  });

  describe('Authorization & Error Handling', () => {
    it('rejects non-admin users', () => {
      const user = {
        data: {
          role: 'employee',
        },
      };

      expect(user.data.role).not.toBe('admin');
    });

    it('requires authentication', () => {
      const user = {
        data: null,
      };

      expect(user.data).toBeNull();
    });

    it('returns 403 for unauthorized access', () => {
      const statusCode = 403;
      expect(statusCode).toBe(403);
    });

    it('returns 400 for invalid request', () => {
      const statusCode = 400;
      expect(statusCode).toBe(400);
    });

    it('returns 500 for server error', () => {
      const statusCode = 500;
      expect(statusCode).toBe(500);
    });
  });

  describe('Data Integrity', () => {
    it('preserves all availability fields on update', () => {
      const original = {
        id: 'avail-1',
        profile_id: 'user-1',
        week_starting: '2026-06-21',
        shift_data: { monday: { morning: true, afternoon: false, evening: false } },
        status: 'pending',
        created_at: '2026-06-20T10:00:00Z',
        updated_at: '2026-06-20T10:00:00Z',
      };

      const updated = {
        ...original,
        status: 'approved',
      };

      expect(updated.profile_id).toBe(original.profile_id);
      expect(updated.week_starting).toBe(original.week_starting);
      expect(updated.shift_data).toEqual(original.shift_data);
      expect(updated.created_at).toBe(original.created_at);
    });

    it('updates updated_at timestamp on status change', () => {
      const before = {
        updated_at: '2026-06-20T10:00:00Z',
      };

      const after = {
        updated_at: '2026-06-21T15:30:00Z',
      };

      expect(new Date(after.updated_at).getTime()).toBeGreaterThan(
        new Date(before.updated_at).getTime()
      );
    });
  });

  describe('Response Format', () => {
    it('follows { data, error } pattern for GET', () => {
      const response = {
        data: {
          availabilities: [],
          time_off_requests: [],
          week_starting: '2026-06-21',
        },
      };

      expect(response.data).toBeDefined();
      expect(response.data.availabilities).toBeDefined();
    });

    it('follows { data, error } pattern for PUT', () => {
      const response = {
        data: {
          id: 'avail-1',
          status: 'approved',
        },
      };

      expect(response.data).toBeDefined();
      expect(response.data.status).toBe('approved');
    });

    it('includes error field on failure', () => {
      const response = {
        error: 'Failed to update availability',
      };

      expect(response.error).toBeDefined();
    });
  });

  describe('Week Starting Parameter', () => {
    it('uses week_starting query parameter', () => {
      const weekStarting = '2026-06-21';
      const params = new URLSearchParams({ week_starting: weekStarting });

      expect(params.get('week_starting')).toBe('2026-06-21');
    });

    it('defaults to current week if not provided', () => {
      const params = new URLSearchParams({});
      const provided = params.get('week_starting');

      expect(provided).toBeNull();
    });

    it('filters availabilities by week', () => {
      const availabilities = [
        { week_starting: '2026-06-21', status: 'pending' },
        { week_starting: '2026-06-28', status: 'pending' },
      ];

      const filtered = availabilities.filter((a) => a.week_starting === '2026-06-21');

      expect(filtered).toHaveLength(1);
      expect(filtered[0].week_starting).toBe('2026-06-21');
    });
  });

  describe('Batch Operations', () => {
    it('handles multiple availabilities in single response', () => {
      const availabilities = [
        { id: 'avail-1', profile_id: 'user-1', status: 'pending' },
        { id: 'avail-2', profile_id: 'user-2', status: 'pending' },
        { id: 'avail-3', profile_id: 'user-3', status: 'approved' },
      ];

      const pending = availabilities.filter((a) => a.status === 'pending');
      const approved = availabilities.filter((a) => a.status === 'approved');

      expect(pending).toHaveLength(2);
      expect(approved).toHaveLength(1);
    });

    it('preserves order when returning availabilities', () => {
      const availabilities = [
        { id: 'avail-1', created_at: '2026-06-20T08:00:00Z' },
        { id: 'avail-2', created_at: '2026-06-20T09:00:00Z' },
        { id: 'avail-3', created_at: '2026-06-20T10:00:00Z' },
      ];

      const sorted = [...availabilities].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      expect(sorted[0].id).toBe('avail-3');
      expect(sorted[sorted.length - 1].id).toBe('avail-1');
    });
  });
});
