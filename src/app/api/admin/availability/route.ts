import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/utils/supabase/auth';

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user.data || user.data.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const weekStarting = searchParams.get('week_starting') || '';

    if (!weekStarting) {
      return Response.json(
        { error: 'Missing required parameter: week_starting' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const [
      { data: availabilities, error: availError },
      { data: timeOffRequests, error: timeOffError },
    ] = await Promise.all([
      supabase
        .from('availabilities')
        .select(`id, profile_id, week_starting, shift_data, status, created_at, updated_at`)
        .eq('week_starting', weekStarting)
        .order('created_at', { ascending: false }),
      supabase
        .from('time_off_requests')
        .select('id, profile_id, start_date, end_date, status, created_at, updated_at')
        .eq('status', 'approved'),
    ]);

    if (availError || timeOffError) {
      throw new Error(availError?.message || timeOffError?.message);
    }

    return Response.json(
      {
        data: {
          availabilities: availabilities || [],
          time_off_requests: timeOffRequests || [],
          week_starting: weekStarting,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('Failed to fetch availabilities:', err);
    return Response.json({ error: 'Failed to fetch availabilities' }, { status: 500 });
  }
}
