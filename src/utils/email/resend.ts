import { Resend } from 'resend';

export interface EmailResult {
  recipient: string;
  sent: boolean;
  error?: string;
}

export interface BroadcastEmailParams {
  recipients: Array<{ email: string; name?: string }>;
  weekStarting: string;
  totalApproved: number;
}

export interface ReminderEmailParams {
  recipients: Array<{ email: string; name?: string }>;
  weekStarting: string;
}

function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }
  return new Resend(apiKey);
}

function getBroadcastEmailTemplate(weekStarting: string, totalApproved: number): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background: #8B2E2E; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 28px;">Your Schedule is Live!</h1>
        <p style="color: #f5e6d3; margin: 8px 0 0 0; font-size: 16px;">Week of ${weekStarting}</p>
      </div>

      <div style="background: #f5e6d3; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="margin-top: 0; color: #333;">Hi,</p>

        <p>Your shift schedule for the week of <strong>${weekStarting}</strong> has been published and is now final.</p>

        <div style="background: #fff; padding: 16px; border-left: 4px solid #8B2E2E; margin: 16px 0;">
          <p style="margin: 0; color: #333;">
            <strong>📋 View Your Schedule</strong><br/>
            Log in to the scheduling portal to see your complete shifts and time-off entries for the week. Your roster has been approved and confirmed by management.
          </p>
        </div>

        <p style="color: #555; font-size: 14px; margin-bottom: 8px;">
          <strong>Schedule Details:</strong>
        </p>
        <ul style="color: #555; font-size: 14px; margin: 8px 0;">
          <li>Week Start: ${weekStarting}</li>
          <li>Total Approved Schedules: ${totalApproved}</li>
          <li>Your shifts are final — no further changes accepted</li>
        </ul>

        <div style="background: #fff3cd; padding: 12px; border-left: 4px solid #ffc107; margin: 16px 0;">
          <p style="margin: 0; color: #856404; font-size: 13px;">
            <strong>⏰ Important:</strong> Please review your schedule immediately. If you notice any errors or have questions, contact management right away.
          </p>
        </div>

        <p style="margin-top: 24px; color: #666; font-size: 12px;">
          Thank you for your dedication to The Red Bean Annapolis. We appreciate your flexibility and commitment to our team!
        </p>
      </div>
    </div>
  `;
}

function getReminderEmailTemplate(weekStarting: string): string {
  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <div style="background: #8B2E2E; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">Schedule Submission Reminder</h1>
      </div>

      <div style="background: #f5e6d3; padding: 24px; border-radius: 0 0 8px 8px;">
        <p style="margin-top: 0;">Hi,</p>

        <p>We haven't received your availability submission for the week of <strong>${weekStarting}</strong>.</p>

        <div style="background: #fff3cd; padding: 12px; border-left: 4px solid #ffc107; margin: 16px 0;">
          <p style="margin: 0; font-weight: bold;">
            ⏰ Deadline Today at 10:00 AM
          </p>
          <p style="margin: 4px 0 0 0; font-size: 14px;">
            Please submit your schedule preferences before the deadline to ensure your availability is included in the final roster.
          </p>
        </div>

        <p>To submit your availability, please log in to the scheduling portal and select your preferred shifts for the upcoming week.</p>

        <p style="margin-top: 24px; color: #666; font-size: 12px;">
          If you have any questions or need assistance, please contact management.
        </p>
      </div>
    </div>
  `;
}

export async function sendBroadcastEmails(params: BroadcastEmailParams): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  if (params.recipients.length === 0) {
    console.warn('No recipients provided for broadcast email');
    return results;
  }

  let resend: Resend | null = null;
  try {
    resend = getResendClient();
  } catch (err) {
    console.error('Failed to initialize Resend:', err);
    return params.recipients.map((r) => ({
      recipient: r.email,
      sent: false,
      error: 'Resend API not configured',
    }));
  }

  const htmlContent = getBroadcastEmailTemplate(params.weekStarting, params.totalApproved);

  for (const recipient of params.recipients) {
    try {
      await resend.emails.send({
        from: 'Red Bean Scheduler <noreply@redbean.local>',
        to: recipient.email,
        subject: `Your Schedule is Live — Week of ${params.weekStarting}`,
        html: htmlContent,
      });

      results.push({
        recipient: recipient.email,
        sent: true,
      });
    } catch (emailError) {
      const errorMsg = emailError instanceof Error ? emailError.message : String(emailError);

      if (errorMsg.includes('invalid_email') || errorMsg.includes('Invalid email')) {
        console.warn(`Invalid email address: ${recipient.email}`);
        results.push({
          recipient: recipient.email,
          sent: false,
          error: 'Invalid email address',
        });
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        console.warn(`Rate limit hit for ${recipient.email}, skipping`);
        results.push({
          recipient: recipient.email,
          sent: false,
          error: 'Rate limit exceeded',
        });
      } else {
        console.error(`Failed to send broadcast email to ${recipient.email}:`, emailError);
        results.push({
          recipient: recipient.email,
          sent: false,
          error: errorMsg,
        });
      }
    }
  }

  return results;
}

export async function sendReminderEmails(params: ReminderEmailParams): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  if (params.recipients.length === 0) {
    console.warn('No recipients provided for reminder email');
    return results;
  }

  let resend: Resend | null = null;
  try {
    resend = getResendClient();
  } catch (err) {
    console.error('Failed to initialize Resend:', err);
    return params.recipients.map((r) => ({
      recipient: r.email,
      sent: false,
      error: 'Resend API not configured',
    }));
  }

  const htmlContent = getReminderEmailTemplate(params.weekStarting);

  for (const recipient of params.recipients) {
    try {
      await resend.emails.send({
        from: 'Red Bean Scheduler <noreply@redbean.local>',
        to: recipient.email,
        subject: `Schedule Submission Reminder — Deadline Today at 10 AM`,
        html: htmlContent,
      });

      results.push({
        recipient: recipient.email,
        sent: true,
      });
    } catch (emailError) {
      const errorMsg = emailError instanceof Error ? emailError.message : String(emailError);

      if (errorMsg.includes('invalid_email') || errorMsg.includes('Invalid email')) {
        console.warn(`Invalid email address: ${recipient.email}`);
        results.push({
          recipient: recipient.email,
          sent: false,
          error: 'Invalid email address',
        });
      } else if (errorMsg.includes('rate limit') || errorMsg.includes('429')) {
        console.warn(`Rate limit hit for ${recipient.email}, skipping`);
        results.push({
          recipient: recipient.email,
          sent: false,
          error: 'Rate limit exceeded',
        });
      } else {
        console.error(`Failed to send reminder email to ${recipient.email}:`, emailError);
        results.push({
          recipient: recipient.email,
          sent: false,
          error: errorMsg,
        });
      }
    }
  }

  return results;
}
