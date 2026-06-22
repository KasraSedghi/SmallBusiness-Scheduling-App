import { createClient } from '@/utils/supabase/server';
import { getWeekStartingDate } from '@/utils/shift-helpers';
import { Resend } from 'resend';

export interface ReminderResult {
  week_starting: string;
  sent_at: string;
  total_employees: number;
  reminders_sent: number;
  skipped_submitted: number;
  skipped_on_vacation: number;
  message: string;
}

function getNextMonday(): string {
  const today = new Date();
  const dayOfWeek = today.getDay();

  let daysUntilMonday = 1 - dayOfWeek;
  if (daysUntilMonday <= 0) {
    daysUntilMonday += 7;
  }

  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);

  return nextMonday.toISOString().split('T')[0];
}

function verifySignature(request: Request): boolean {
  const signature = request.headers.get('x-cron-secret');
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    console.warn('CRON_SECRET not configured');
    return false;
  }

  return signature === secret;
}

function isDateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}

function getWeekEndDate(weekStarting: string): string {
  const date = new Date(weekStarting);
  date.setDate(date.getDate() + 6);
  return date.toISOString().split('T')[0];
}

export async function POST(request: Request) {
  try {
    if (!verifySignature(request)) {
      return Response.json(
        { error: 'Invalid or missing cron signature' },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const upcomingWeekStart = getNextMonday();
    const weekEndDate = getWeekEndDate(upcomingWeekStart);

    const [
      { data: profiles, error: profilesError },
      { data: submissions, error: submissionsError },
      { data: timeOffRequests, error: timeOffError },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select('id, email, role')
        .eq('role', 'employee'),
      supabase
        .from('availabilities')
        .select('id, profile_id, week_starting')
        .eq('week_starting', upcomingWeekStart),
      supabase
        .from('time_off_requests')
        .select('id, profile_id, start_date, end_date, status')
        .eq('status', 'approved'),
    ]);

    if (profilesError || submissionsError || timeOffError) {
      throw new Error(
        `Database query failed: ${profilesError?.message || submissionsError?.message || timeOffError?.message}`
      );
    }

    const submissionsByProfile = new Set(
      (submissions || []).map((s: any) => s.profile_id)
    );

    const approvedTimeOff = (timeOffRequests || []).filter(
      (t: any) =>
        isDateInRange(upcomingWeekStart, t.start_date, t.end_date) &&
        isDateInRange(weekEndDate, t.start_date, t.end_date)
    );

    const onVacationProfiles = new Set(
      approvedTimeOff.map((t: any) => t.profile_id)
    );

    const employeesToNotify = (profiles || []).filter(
      (p: any) =>
        !submissionsByProfile.has(p.id) && !onVacationProfiles.has(p.id)
    );

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(resendApiKey);
    let sentCount = 0;
    const errors: string[] = [];

    for (const employee of employeesToNotify as any[]) {
      try {
        await resend.emails.send({
          from: 'Red Bean Scheduler <noreply@redbean.local>',
          to: employee.email,
          subject: `Schedule Submission Reminder — Deadline Today at 10 AM`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #8B2E2E;">Schedule Submission Reminder</h2>
              <p>Hi,</p>
              <p>We haven't received your availability submission for the week of <strong>${upcomingWeekStart}</strong>.</p>
              <p style="background: #fff3cd; padding: 12px; border-left: 4px solid #ffc107; margin: 16px 0;">
                <strong>⏰ Deadline Today at 10:00 AM</strong> — Please submit your schedule preferences before the deadline to ensure your availability is included in the final roster.
              </p>
              <p>To submit your availability, please log in to the scheduling portal and select your preferred shifts for the upcoming week.</p>
              <p style="margin-top: 24px; color: #666; font-size: 12px;">
                If you have any questions or need assistance, please contact management.
              </p>
            </div>
          `,
        });
        sentCount++;
      } catch (emailError) {
        errors.push(`Failed to send to ${employee.email}: ${String(emailError)}`);
      }
    }

    if (errors.length > 0) {
      console.error('Email sending errors:', errors);
    }

    const result: ReminderResult = {
      week_starting: upcomingWeekStart,
      sent_at: new Date().toISOString(),
      total_employees: profiles?.length || 0,
      reminders_sent: sentCount,
      skipped_submitted: submissionsByProfile.size,
      skipped_on_vacation: onVacationProfiles.size,
      message: `Sent ${sentCount} reminder email(s) for week of ${upcomingWeekStart}. ${submissionsByProfile.size} submitted, ${onVacationProfiles.size} on vacation.`,
    };

    return Response.json({ data: result }, { status: 200 });
  } catch (err) {
    console.error('Cron reminder job failed:', err);
    return Response.json(
      { error: 'Failed to send reminder emails' },
      { status: 500 }
    );
  }
}
