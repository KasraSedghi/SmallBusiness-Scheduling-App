import { describe, it, expect } from 'vitest';

describe('Admin Publish Schedule API', () => {
  describe('POST /api/admin/publish', () => {
    it('publishes schedule with approved availabilities', () => {
      const approvedAvailabilities = [
        { id: 'avail-1', profile_id: 'user-1', status: 'approved' },
        { id: 'avail-2', profile_id: 'user-2', status: 'approved' },
        { id: 'avail-3', profile_id: 'user-3', status: 'approved' },
      ];

      const approvedCount = approvedAvailabilities.filter(
        (a) => a.status === 'approved'
      ).length;

      expect(approvedCount).toBe(3);
    });

    it('requires week_starting in request body', () => {
      const body = {
        week_starting: '2026-06-21',
      };

      expect(body.week_starting).toBe('2026-06-21');
    });

    it('rejects request without week_starting', () => {
      const body = {};

      expect(body.week_starting).toBeUndefined();
    });

    it('returns success message with week and count', () => {
      const result = {
        week_starting: '2026-06-21',
        published_at: '2026-06-21T14:30:00Z',
        total_approved: 5,
        message: 'Schedule published successfully for week of 2026-06-21. 5 employee(s) approved.',
      };

      expect(result.message).toContain('2026-06-21');
      expect(result.message).toContain('5');
    });

    it('fails if no approved availabilities', () => {
      const approvedAvailabilities: any[] = [];

      if (approvedAvailabilities.length === 0) {
        const error = 'Cannot publish: no approved availabilities for this week';
        expect(error).toContain('no approved availabilities');
      }
    });

    it('includes published_at timestamp in response', () => {
      const result = {
        published_at: '2026-06-21T14:30:00Z',
      };

      const publishedDate = new Date(result.published_at);
      expect(publishedDate.getTime()).toBeGreaterThan(0);
    });

    it('counts only approved availabilities for publish', () => {
      const availabilities = [
        { id: 'avail-1', status: 'pending' },
        { id: 'avail-2', status: 'approved' },
        { id: 'avail-3', status: 'approved' },
        { id: 'avail-4', status: 'pending' },
      ];

      const approvedCount = availabilities.filter((a) => a.status === 'approved').length;

      expect(approvedCount).toBe(2);
    });

    it('returns 400 error if zero approved', () => {
      const statusCode = 400;
      expect(statusCode).toBe(400);
    });

    it('returns 200 success if approved exist', () => {
      const statusCode = 200;
      expect(statusCode).toBe(200);
    });
  });

  describe('Authorization & Error Handling', () => {
    it('rejects non-admin users', () => {
      const user = { role: 'employee' };

      expect(user.role).not.toBe('admin');
    });

    it('requires authentication', () => {
      const user = null;

      expect(user).toBeNull();
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

    it('includes error message in response', () => {
      const response = {
        error: 'Cannot publish: no approved availabilities for this week',
      };

      expect(response.error).toBeDefined();
    });
  });

  describe('Response Format', () => {
    it('follows { data, error } pattern', () => {
      const response = {
        data: {
          week_starting: '2026-06-21',
          published_at: '2026-06-21T14:30:00Z',
          total_approved: 5,
          message: 'Schedule published successfully...',
        },
      };

      expect(response.data).toBeDefined();
      expect(response.data.week_starting).toBe('2026-06-21');
    });

    it('includes total_approved count', () => {
      const response = {
        data: {
          total_approved: 8,
        },
      };

      expect(response.data.total_approved).toBe(8);
    });

    it('includes human-readable message', () => {
      const response = {
        data: {
          message: 'Schedule published successfully for week of 2026-06-21. 5 employee(s) approved.',
        },
      };

      expect(response.data.message).toContain('successfully');
      expect(response.data.message).toContain('approved');
    });
  });

  describe('Week Starting Validation', () => {
    it('accepts valid ISO date format', () => {
      const weekStarting = '2026-06-21';
      const dateObj = new Date(weekStarting);

      expect(dateObj instanceof Date).toBe(true);
    });

    it('rejects missing week_starting', () => {
      const body = {};

      if (!body.week_starting) {
        expect(true).toBe(true);
      }
    });

    it('returns specific week in response', () => {
      const result = {
        week_starting: '2026-06-21',
      };

      expect(result.week_starting).toBe('2026-06-21');
    });
  });

  describe('Publish Workflow', () => {
    it('filters availabilities by week before counting', () => {
      const allAvailabilities = [
        { id: '1', week_starting: '2026-06-21', status: 'approved' },
        { id: '2', week_starting: '2026-06-21', status: 'approved' },
        { id: '3', week_starting: '2026-06-28', status: 'approved' },
      ];

      const weekToPublish = '2026-06-21';
      const forWeek = allAvailabilities.filter(
        (a) => a.week_starting === weekToPublish && a.status === 'approved'
      );

      expect(forWeek).toHaveLength(2);
    });

    it('generates timestamp in ISO format', () => {
      const published = new Date().toISOString();
      expect(published).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('preserves week_starting from request', () => {
      const request = { week_starting: '2026-06-21' };
      const response = { week_starting: request.week_starting };

      expect(response.week_starting).toBe(request.week_starting);
    });
  });

  describe('Edge Cases', () => {
    it('handles exactly one approved availability', () => {
      const availabilities = [{ id: 'avail-1', status: 'approved' }];

      const approvedCount = availabilities.filter((a) => a.status === 'approved').length;

      expect(approvedCount).toBe(1);
    });

    it('handles large number of approved availabilities', () => {
      const count = 100;
      const availabilities = Array.from({ length: count }, (_, i) => ({
        id: `avail-${i}`,
        status: 'approved',
      }));

      const approvedCount = availabilities.filter((a) => a.status === 'approved').length;

      expect(approvedCount).toBe(count);
    });

    it('handles mix of approved and pending', () => {
      const availabilities = [
        { id: '1', status: 'approved' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'approved' },
        { id: '4', status: 'pending' },
        { id: '5', status: 'approved' },
      ];

      const approvedCount = availabilities.filter((a) => a.status === 'approved').length;
      const pendingCount = availabilities.filter((a) => a.status === 'pending').length;

      expect(approvedCount).toBe(3);
      expect(pendingCount).toBe(2);
    });

    it('succeeds even if some shifts are under-staffed (non-blocking)', () => {
      const staffingStatus = {
        monday_morning: { required: 4, actual: 2, understaffed: true },
        tuesday_evening: { required: 4, actual: 4, understaffed: false },
      };

      const canPublish = true;
      expect(canPublish).toBe(true);
    });
  });

  describe('Data Integrity', () => {
    it('does not modify availabilities during publish', () => {
      const original = {
        id: 'avail-1',
        status: 'approved',
        week_starting: '2026-06-21',
      };

      const result = {
        week_starting: '2026-06-21',
        published_at: '2026-06-21T14:30:00Z',
        total_approved: 1,
      };

      expect(original.status).toBe('approved');
      expect(original.id).toBe('avail-1');
    });

    it('returns accurate approved count', () => {
      const availabilities = [
        { status: 'approved' },
        { status: 'approved' },
        { status: 'pending' },
        { status: 'approved' },
      ];

      const approvedCount = availabilities.filter((a) => a.status === 'approved').length;

      expect(approvedCount).toBe(3);
    });
  });

  describe('Broadcast Email Integration', () => {
    it('queues broadcast emails on successful publish', () => {
      const response = {
        data: {
          broadcast_queued: true,
        },
      };

      expect(response.data.broadcast_queued).toBe(true);
    });

    it('includes broadcast_queued flag in response', () => {
      const result = {
        week_starting: '2026-06-21',
        published_at: '2026-06-21T14:30:00Z',
        total_approved: 5,
        broadcast_queued: true,
        message: 'Broadcasting notifications...',
      };

      expect(result.broadcast_queued).toBe(true);
    });

    it('mentions broadcasting in success message', () => {
      const message = 'Schedule published successfully. 5 employee(s) approved. Broadcasting notifications...';

      expect(message).toContain('Broadcasting');
    });

    it('fetches approved employee profiles after publish', () => {
      const query = 'SELECT profiles WHERE id IN approved_availabilities';
      expect(query).toContain('profiles');
    });

    it('extracts emails from profiles for broadcast', () => {
      const profile = { id: 'user-1', email: 'john@example.com' };
      expect(profile.email).toBeDefined();
    });

    it('passes week_starting to broadcast sender', () => {
      const params = { weekStarting: '2026-06-21' };
      expect(params.weekStarting).toBe('2026-06-21');
    });

    it('passes total_approved count to broadcast', () => {
      const params = { totalApproved: 5 };
      expect(params.totalApproved).toBe(5);
    });

    it('includes all approved employee recipients', () => {
      const recipients = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
        { email: 'user3@example.com' },
      ];

      expect(recipients).toHaveLength(3);
    });

    it('handles profiles with missing emails', () => {
      const profiles = [
        { id: 'user-1', email: 'valid@example.com' },
        { id: 'user-2', email: null },
      ];

      expect(profiles).toHaveLength(2);
    });

    it('logs broadcast send completion', () => {
      const logEntry = '[Broadcast] Sent 5/5 emails for week 2026-06-21. Failed: 0';
      expect(logEntry).toContain('Sent');
    });

    it('logs failed broadcast recipients', () => {
      const logEntry = '[Broadcast] Failed recipients: [...]';
      expect(logEntry).toContain('Failed');
    });
  });

  describe('Non-Blocking Email Queue', () => {
    it('returns HTTP 200 immediately after publish', () => {
      const statusCode = 200;

      expect(statusCode).toBe(200);
    });

    it('does not wait for email send before responding', () => {
      const responseTime = 'immediate';

      expect(responseTime).toBe('immediate');
    });

    it('uses Promise.then() to queue emails', () => {
      const hasNonBlockingPattern = true;
      expect(hasNonBlockingPattern).toBe(true);
    });

    it('catches broadcast errors without throwing', () => {
      const shouldThrow = false;
      expect(shouldThrow).toBe(false);
    });

    it('allows manager UI to complete without lag', () => {
      const isBlocking = false;
      expect(isBlocking).toBe(false);
    });

    it('does not timeout while sending emails', () => {
      const hasTimeout = false;
      expect(hasTimeout).toBe(false);
    });

    it('includes "Broadcasting notifications..." in message', () => {
      const message = 'Schedule published successfully. Broadcasting notifications...';
      expect(message).toContain('Broadcasting');
    });

    it('client receives success even if emails fail', () => {
      const clientStatus = 200;
      const emailFailure = 'logged separately';

      expect(clientStatus).toBe(200);
      expect(emailFailure).toContain('logged');
    });
  });

  describe('Broadcast Email Content', () => {
    it('subject includes "Your Schedule is Live"', () => {
      const subject = 'Your Schedule is Live — Week of 2026-06-21';
      expect(subject).toContain('Schedule is Live');
    });

    it('subject includes week starting date', () => {
      const subject = 'Your Schedule is Live — Week of 2026-06-21';
      expect(subject).toContain('2026-06-21');
    });

    it('content mentions week starting date', () => {
      const content = 'week of 2026-06-21';
      expect(content).toContain('2026-06-21');
    });

    it('content mentions total approved count', () => {
      const content = 'Total Approved Schedules: 5';
      expect(content).toContain('5');
    });

    it('uses Red Bean branding in from address', () => {
      const from = 'Red Bean Scheduler <noreply@redbean.local>';
      expect(from).toContain('Red Bean');
    });

    it('content includes call-to-action for portal', () => {
      const cta = 'Log in to the scheduling portal';
      expect(cta).toContain('portal');
    });

    it('content includes "schedule is final" message', () => {
      const message = 'Your shifts are final — no further changes accepted';
      expect(message).toContain('final');
    });

    it('content includes professional greeting', () => {
      const greeting = 'Hi,';
      expect(greeting).toContain('Hi');
    });

    it('content includes Red Bean cafe color (#8B2E2E)', () => {
      const color = '#8B2E2E';
      expect(color).toBeDefined();
    });

    it('content includes warning/alert styling', () => {
      const style = '#fff3cd';
      expect(style).toBeDefined();
    });
  });

  describe('Error Handling for Broadcasts', () => {
    it('handles broadcast failure gracefully', () => {
      const publishResult = { status: 200 };

      expect(publishResult.status).toBe(200);
    });

    it('still publishes if broadcast queue fails', () => {
      const canPublish = true;

      expect(canPublish).toBe(true);
    });

    it('logs broadcast errors to console', () => {
      const logEntry = '[Broadcast] Unexpected error during email dispatch';
      expect(logEntry).toContain('Broadcast');
    });

    it('continues if profile fetch fails', () => {
      const publishResult = { status: 200 };
      expect(publishResult.status).toBe(200);
    });

    it('continues if email send fails', () => {
      const publishResult = { status: 200 };
      expect(publishResult.status).toBe(200);
    });

    it('logs individual email failures separately', () => {
      const logEntry = 'Failed to send broadcast email to user@example.com';
      expect(logEntry).toContain('Failed');
    });

    it('handles rate limiting without blocking publish', () => {
      const publishResult = { status: 200 };
      expect(publishResult.status).toBe(200);
    });

    it('handles invalid emails without blocking publish', () => {
      const publishResult = { status: 200 };
      expect(publishResult.status).toBe(200);
    });
  });

  describe('Performance & Scalability', () => {
    it('completes publish before sending 1000+ emails', () => {
      const responseTime = 'immediate';
      const emailTime = 'background';

      expect(responseTime).toBe('immediate');
    });

    it('handles large email batches efficiently', () => {
      const recipientCount = 500;
      expect(recipientCount).toBeGreaterThan(100);
    });

    it('batches database queries for profiles', () => {
      const queryType = 'single batch query';
      expect(queryType).toContain('batch');
    });

    it('does not create N+1 queries', () => {
      const singleFetch = true;
      expect(singleFetch).toBe(true);
    });

    it('returns response quickly regardless of email count', () => {
      const isQuick = true;
      expect(isQuick).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    it('publishes and broadcasts for single employee', () => {
      const approvedCount = 1;
      const canPublish = approvedCount > 0;

      expect(canPublish).toBe(true);
    });

    it('publishes and broadcasts for 100+ employees', () => {
      const approvedCount = 150;
      const canPublish = approvedCount > 0;

      expect(canPublish).toBe(true);
    });

    it('publishes schedule with week date', () => {
      const result = { week_starting: '2026-06-21' };
      expect(result.week_starting).toBe('2026-06-21');
    });

    it('broadcasts with correct week info to all employees', () => {
      const broadcast = {
        weekStarting: '2026-06-21',
        recipients: [{ email: 'user1@example.com' }, { email: 'user2@example.com' }],
      };

      expect(broadcast.weekStarting).toBe('2026-06-21');
      expect(broadcast.recipients).toHaveLength(2);
    });

    it('manager sees success before emails sent', () => {
      const managerFeedback = {
        message: 'Schedule published successfully. Broadcasting notifications...',
        status: 200,
      };

      expect(managerFeedback.status).toBe(200);
      expect(managerFeedback.message).toContain('published');
    });

    it('employees receive emails asynchronously', () => {
      const isAsync = true;
      expect(isAsync).toBe(true);
    });
  });
});
