import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/utils/supabase/auth';
import { getWeekStartingDate } from '@/utils/shift-helpers';

export interface PublishResult {
  week_starting: string;
  published_at: string;
  total_approved: number;
  message: string;
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user.data || user.data.role !== 'admin') {
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
      message: `Schedule published successfully for week of ${week_starting}. ${approvedCount} employee(s) approved.`,
    };

    return Response.json(
      { data: result },
      { status: 200 }
    );
  } catch (err) {
    console.error('Failed to publish schedule:', err);
    return Response.json({ error: 'Failed to publish schedule' }, { status: 500 });
  }
}
