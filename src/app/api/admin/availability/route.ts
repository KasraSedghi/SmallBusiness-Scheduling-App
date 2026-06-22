import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/utils/supabase/auth';
import { getWeekStartingDate } from '@/utils/shift-helpers';
import { Availability, Profile, TimeOffRequest } from '@/types/index';

export interface AvailabilityWithProfile extends Availability {
  profile?: Profile;
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user.data || user.data.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const weekStarting = searchParams.get('week_starting') || getWeekStartingDate();

    const supabase = await createClient();

    const { data: availabilities, error } = await supabase
      .from('availabilities')
      .select('id, profile_id, week_starting, shift_data, status, created_at, updated_at')
      .eq('week_starting', weekStarting)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, role, avatar_url');

    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    const enrichedAvailabilities = (availabilities || []).map((a: any) => ({
      ...a,
      profile: profileMap.get(a.profile_id),
    }));

    const { data: timeOffRequests } = await supabase
      .from('time_off_requests')
      .select('id, profile_id, start_date, end_date, status')
      .eq('status', 'approved');

    return Response.json({
      data: {
        availabilities: enrichedAvailabilities,
        time_off_requests: timeOffRequests || [],
        week_starting: weekStarting,
      },
    });
  } catch (err) {
    console.error('Failed to fetch availabilities:', err);
    return Response.json({ error: 'Failed to fetch availabilities' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user.data || user.data.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, status } = body;

    if (!id || !status || !['pending', 'approved'].includes(status)) {
      return Response.json(
        { error: 'Invalid request: id and status required, status must be "pending" or "approved"' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: updated, error } = await supabase
      .from('availabilities')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({ data: updated });
  } catch (err) {
    console.error('Failed to update availability:', err);
    return Response.json({ error: 'Failed to update availability' }, { status: 500 });
  }
}
