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

    const profileIds = [...new Set((availabilities || []).map((a: any) => a.profile_id))];
    const { data: profiles } = profileIds.length
      ? await supabase.from('profiles').select('id, email, avatar_url').in('id', profileIds)
      : { data: [] };

    const profileById = new Map((profiles || []).map((p: any) => [p.id, p]));
    const enrichedAvailabilities = (availabilities || []).map((a: any) => ({
      ...a,
      profile: profileById.get(a.profile_id) || null,
    }));

    return Response.json(
      {
        data: {
          availabilities: enrichedAvailabilities,
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

/**
 * PUT /api/admin/availability
 * Update an availability's approval status.
 * Body: { id: string, status: 'pending' | 'approved' }
 */
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user.data || user.data.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.id !== 'string') {
      return Response.json({ error: 'Missing required field: id' }, { status: 400 });
    }

    if (body.status !== 'pending' && body.status !== 'approved') {
      return Response.json(
        { error: 'Invalid status: must be "pending" or "approved"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await (supabase.from('availabilities') as any)
      .update({ status: body.status, updated_at: new Date().toISOString() })
      .eq('id', body.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Failed to update availability:', err);
    return Response.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
