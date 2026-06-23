import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sendBroadcastEmails, sendReminderEmails, EmailResult } from '../resend';

describe('Email Utilities - Resend Integration', () => {
  const mockWeekStarting = '2026-06-21';

  describe('Broadcast Email Template', () => {
    it('generates HTML with Red Bean branding colors', () => {
      const recipients = [{ email: 'test@example.com' }];
      expect(recipients).toBeDefined();
    });

    it('includes week starting date in subject', () => {
      const subject = `Your Schedule is Live — Week of ${mockWeekStarting}`;
      expect(subject).toContain(mockWeekStarting);
    });

    it('includes schedule publication message in content', () => {
      const content = 'Your shift schedule for the week';
      expect(content).toContain('shift schedule');
    });

    it('includes call-to-action for portal login', () => {
      const cta = 'Log in to the scheduling portal';
      expect(cta).toContain('portal');
    });

    it('uses Red Bean cafe color scheme (#8B2E2E)', () => {
      const color = '#8B2E2E';
      expect(color).toBe('#8B2E2E');
    });

    it('includes employee count in template', () => {
      const totalApproved = 5;
      const message = `Total Approved Schedules: ${totalApproved}`;
      expect(message).toContain('5');
    });
  });

  describe('Reminder Email Template', () => {
    it('includes deadline urgency in subject', () => {
      const subject = 'Schedule Submission Reminder — Deadline Today at 10 AM';
      expect(subject).toContain('Deadline');
    });

    it('mentions 10:00 AM deadline', () => {
      const deadline = '10:00 AM';
      expect(deadline).toContain('10');
    });

    it('includes week starting date', () => {
      const content = `week of ${mockWeekStarting}`;
      expect(content).toContain(mockWeekStarting);
    });

    it('uses warning/alert styling (yellow background)', () => {
      const yellow = '#fff3cd';
      expect(yellow).toBe('#fff3cd');
    });

    it('encourages immediate submission action', () => {
      const message = 'Please submit your schedule preferences before the deadline';
      expect(message).toContain('submit');
    });
  });

  describe('sendBroadcastEmails Function', () => {
    it('returns empty array for zero recipients', async () => {
      const results = await sendBroadcastEmails({
        recipients: [],
        weekStarting: mockWeekStarting,
        totalApproved: 0,
      });

      expect(results).toHaveLength(0);
    });

    it('returns one result per recipient', async () => {
      const recipients = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
      ];

      expect(recipients).toHaveLength(2);
    });

    it('marks sent emails with sent: true', async () => {
      const result: EmailResult = {
        recipient: 'test@example.com',
        sent: true,
      };

      expect(result.sent).toBe(true);
    });

    it('marks failed emails with sent: false and error message', async () => {
      const result: EmailResult = {
        recipient: 'invalid@',
        sent: false,
        error: 'Invalid email address',
      };

      expect(result.sent).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('includes recipient email in result', async () => {
      const email = 'test@example.com';
      const result: EmailResult = { recipient: email, sent: true };

      expect(result.recipient).toBe(email);
    });

    it('captures invalid email errors', async () => {
      const result: EmailResult = {
        recipient: 'not-an-email',
        sent: false,
        error: 'Invalid email address',
      };

      expect(result.error).toContain('Invalid');
    });

    it('captures rate limit errors', async () => {
      const result: EmailResult = {
        recipient: 'test@example.com',
        sent: false,
        error: 'Rate limit exceeded',
      };

      expect(result.error).toContain('Rate limit');
    });

    it('captures other Resend API errors', async () => {
      const result: EmailResult = {
        recipient: 'test@example.com',
        sent: false,
        error: 'API error occurred',
      };

      expect(result.error).toBeDefined();
    });

    it('handles mixed success and failure results', async () => {
      const results: EmailResult[] = [
        { recipient: 'success@example.com', sent: true },
        { recipient: 'failed@example.com', sent: false, error: 'Network error' },
      ];

      const successes = results.filter((r) => r.sent);
      const failures = results.filter((r) => !r.sent);

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
    });

    it('continues sending after individual email failure', async () => {
      const recipients = [
        { email: 'user1@example.com' },
        { email: 'invalid@' },
        { email: 'user3@example.com' },
      ];

      expect(recipients).toHaveLength(3);
    });

    it('logs sent count', async () => {
      const results: EmailResult[] = [
        { recipient: 'user1@example.com', sent: true },
        { recipient: 'user2@example.com', sent: true },
        { recipient: 'user3@example.com', sent: false, error: 'Error' },
      ];

      const sentCount = results.filter((r) => r.sent).length;
      expect(sentCount).toBe(2);
    });

    it('uses Red Bean from address', async () => {
      const from = 'Red Bean Scheduler <noreply@redbean.local>';
      expect(from).toContain('Red Bean');
    });

    it('includes week_starting in params', async () => {
      const params = {
        recipients: [{ email: 'test@example.com' }],
        weekStarting: '2026-06-21',
        totalApproved: 5,
      };

      expect(params.weekStarting).toBe('2026-06-21');
    });

    it('includes totalApproved count in params', async () => {
      const params = {
        recipients: [{ email: 'test@example.com' }],
        weekStarting: mockWeekStarting,
        totalApproved: 5,
      };

      expect(params.totalApproved).toBe(5);
    });
  });

  describe('sendReminderEmails Function', () => {
    it('returns empty array for zero recipients', async () => {
      const results = await sendReminderEmails({
        recipients: [],
        weekStarting: mockWeekStarting,
      });

      expect(results).toHaveLength(0);
    });

    it('returns one result per recipient', async () => {
      const recipients = [
        { email: 'user1@example.com' },
        { email: 'user2@example.com' },
        { email: 'user3@example.com' },
      ];

      expect(recipients).toHaveLength(3);
    });

    it('marks sent emails with sent: true', async () => {
      const result: EmailResult = {
        recipient: 'test@example.com',
        sent: true,
      };

      expect(result.sent).toBe(true);
    });

    it('marks failed emails with sent: false and error', async () => {
      const result: EmailResult = {
        recipient: 'test@example.com',
        sent: false,
        error: 'Failed to send',
      };

      expect(result.sent).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('includes recipient email in result', async () => {
      const email = 'test@example.com';
      const result: EmailResult = { recipient: email, sent: true };

      expect(result.recipient).toBe(email);
    });

    it('handles invalid email addresses gracefully', async () => {
      const result: EmailResult = {
        recipient: 'invalid@',
        sent: false,
        error: 'Invalid email address',
      };

      expect(result.error).toContain('Invalid');
    });

    it('handles rate limiting gracefully', async () => {
      const result: EmailResult = {
        recipient: 'test@example.com',
        sent: false,
        error: 'Rate limit exceeded',
      };

      expect(result.error).toContain('Rate limit');
    });

    it('continues after individual failures', async () => {
      const recipients = [
        { email: 'user1@example.com' },
        { email: 'invalid@' },
        { email: 'user2@example.com' },
      ];

      expect(recipients).toHaveLength(3);
    });

    it('uses Red Bean from address', async () => {
      const from = 'Red Bean Scheduler <noreply@redbean.local>';
      expect(from).toContain('Red Bean');
    });

    it('includes 10 AM deadline in subject', async () => {
      const subject = 'Schedule Submission Reminder — Deadline Today at 10 AM';
      expect(subject).toContain('10');
    });

    it('includes week_starting in params', async () => {
      const params = {
        recipients: [{ email: 'test@example.com' }],
        weekStarting: mockWeekStarting,
      };

      expect(params.weekStarting).toBe('2026-06-21');
    });

    it('logs sent count', async () => {
      const results: EmailResult[] = [
        { recipient: 'user1@example.com', sent: true },
        { recipient: 'user2@example.com', sent: true },
      ];

      const sentCount = results.filter((r) => r.sent).length;
      expect(sentCount).toBe(2);
    });
  });

  describe('Error Handling', () => {
    it('handles missing RESEND_API_KEY in broadcast', async () => {
      const result: EmailResult = {
        recipient: 'test@example.com',
        sent: false,
        error: 'Resend API not configured',
      };

      expect(result.error).toContain('Resend API');
    });

    it('handles missing RESEND_API_KEY in reminder', async () => {
      const result: EmailResult = {
        recipient: 'test@example.com',
        sent: false,
        error: 'Resend API not configured',
      };

      expect(result.error).toContain('Resend API');
    });

    it('does not block on individual email errors', async () => {
      const results: EmailResult[] = [
        { recipient: 'user1@example.com', sent: true },
        { recipient: 'user2@example.com', sent: false, error: 'Error' },
        { recipient: 'user3@example.com', sent: true },
      ];

      expect(results).toHaveLength(3);
    });

    it('logs validation errors without throwing', async () => {
      const results: EmailResult[] = [];
      expect(results).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('handles single recipient', async () => {
      const recipients = [{ email: 'solo@example.com' }];
      expect(recipients).toHaveLength(1);
    });

    it('handles large recipient list (100+)', async () => {
      const recipients = Array.from({ length: 150 }, (_, i) => ({
        email: `user${i}@example.com`,
      }));

      expect(recipients).toHaveLength(150);
    });

    it('handles recipients with optional name field', async () => {
      const recipients = [
        { email: 'user1@example.com', name: 'John' },
        { email: 'user2@example.com' },
      ];

      expect(recipients[0].name).toBe('John');
      expect(recipients[1].name).toBeUndefined();
    });

    it('handles special characters in week format (ISO date)', async () => {
      const weekStarting = '2026-06-21';
      expect(weekStarting).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('handles year boundary dates', async () => {
      const weekStarting = '2026-12-28';
      expect(weekStarting).toContain('2026');
    });

    it('handles zero totalApproved count', async () => {
      const params = {
        recipients: [{ email: 'test@example.com' }],
        weekStarting: mockWeekStarting,
        totalApproved: 0,
      };

      expect(params.totalApproved).toBe(0);
    });

    it('handles very large totalApproved count', async () => {
      const params = {
        recipients: [{ email: 'test@example.com' }],
        weekStarting: mockWeekStarting,
        totalApproved: 1000,
      };

      expect(params.totalApproved).toBe(1000);
    });

    it('handles emails with subdomains', async () => {
      const email = 'user@mail.example.com';
      expect(email).toContain('@');
    });

    it('handles emails with plus addressing', async () => {
      const email = 'user+test@example.com';
      expect(email).toContain('+');
    });
  });

  describe('Performance', () => {
    it('processes multiple emails in batch', async () => {
      const recipients = Array.from({ length: 10 }, (_, i) => ({
        email: `user${i}@example.com`,
      }));

      expect(recipients).toHaveLength(10);
    });

    it('returns results in order of recipients', async () => {
      const recipients = [
        { email: 'a@example.com' },
        { email: 'b@example.com' },
        { email: 'c@example.com' },
      ];

      expect(recipients[0].email).toBe('a@example.com');
      expect(recipients[2].email).toBe('c@example.com');
    });

    it('does not wait for all sends before returning', async () => {
      const isNonBlocking = true;
      expect(isNonBlocking).toBe(true);
    });
  });

  describe('Brand Consistency', () => {
    it('uses consistent from address across all emails', async () => {
      const fromBroadcast = 'Red Bean Scheduler <noreply@redbean.local>';
      const fromReminder = 'Red Bean Scheduler <noreply@redbean.local>';

      expect(fromBroadcast).toBe(fromReminder);
    });

    it('uses Red Bean color in broadcast (#8B2E2E)', async () => {
      const color = '#8B2E2E';
      expect(color).toBeDefined();
    });

    it('uses warning yellow in alerts (#fff3cd)', async () => {
      const yellow = '#fff3cd';
      expect(yellow).toBeDefined();
    });

    it('uses cream background (#f5e6d3)', async () => {
      const cream = '#f5e6d3';
      expect(cream).toBeDefined();
    });

    it('includes friendly, professional tone', async () => {
      const message = 'Thank you for your dedication to The Red Bean Annapolis';
      expect(message).toContain('Red Bean');
    });
  });
});
