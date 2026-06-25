import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/utils/supabase/admin-guard';
import { sendBroadcastEmails } from '@/utils/email/resend';

export interface PublishResult {
  week_starting: string;
  published_at: string;
  total_approved: number;
  broadcast_queued: boolean;
  message: string;
}

async function triggerBroadcastEmails(weekStarting: string, approvedCount: number): Promise<void> {
  try {
    const supabase = await createClient();

    const { data: approvedAvailabilities, error: fetchError } = await supabase
      .from('availabilities')
      .select('profile_id, status')
      .eq('week_starting', weekStarting)
      .eq('status', 'approved');

    if (fetchError) {
      console.error('Failed to fetch approved availabilities for broadcast:', fetchError);
      return;
    }

    const approvedProfileIds = (approvedAvailabilities || []).map((a: any) => a.profile_id);

    if (approvedProfileIds.length === 0) {
      console.warn('No approved profiles found for broadcast');
      return;
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', approvedProfileIds);

    if (profileError) {
      console.error('Failed to fetch profiles for broadcast:', profileError);
      return;
    }

    const recipients = (profiles || []).map((p: any) => ({
      email: p.email,
      name: p.email.split('@')[0],
    }));

    const results = await sendBroadcastEmails({
      recipients,
      weekStarting,
      totalApproved: approvedCount,
    });

    const sentCount = results.filter((r) => r.sent).length;
    const failedCount = results.filter((r) => !r.sent).length;

    console.log(
      `[Broadcast] Sent ${sentCount}/${recipients.length} emails for week ${weekStarting}. Failed: ${failedCount}`
    );

    if (failedCount > 0) {
      const failures = results.filter((r) => !r.sent);
      console.warn('[Broadcast] Failed recipients:', failures);
    }
  } catch (err) {
    console.error('[Broadcast] Unexpected error during email dispatch:', err);
  }
}

export async function POST(request: Request) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { week_starting } = body;

    if (!week_starting) {
      return Response.json(
        { error: 'Missing required field: week_starting' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: approvedAvailabilities, error: fetchError } = await supabase
      .from('availabilities')
      .select('id, profile_id, week_starting, status')
      .eq('week_starting', week_starting);

    if (fetchError) throw fetchError;

    const approvedCount = (approvedAvailabilities || []).filter(
      (a: any) => a.status === 'approved'
    ).length;

    if (approvedCount === 0) {
      return Response.json(
        {
          error: 'Cannot publish: no approved availabilities for this week',
          data: { approvedCount: 0 },
        },
        { status: 400 }
      );
    }

    const publishedAt = new Date().toISOString();

    const result: PublishResult = {
      week_starting,
      published_at: publishedAt,
      total_approved: approvedCount,
      broadcast_queued: true,
      message: `Schedule published successfully for week of ${week_starting}. ${approvedCount} employee(s) approved. Broadcasting notifications...`,
    };

    triggerBroadcastEmails(week_starting, approvedCount).catch((err) => {
      console.error('[Broadcast] Failed to queue broadcast emails:', err);
    });

    return Response.json({ data: result }, { status: 200 });
  } catch (err) {
    console.error('Failed to publish schedule:', err);
    return Response.json({ error: 'Failed to publish schedule' }, { status: 500 });
  }
}
