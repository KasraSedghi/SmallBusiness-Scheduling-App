import { createClient } from '@/utils/supabase/server';
import { getCurrentUser } from '@/utils/supabase/auth';
import { getWeekStartingDate } from '@/utils/shift-helpers';

const DEFAULT_CAPACITIES = {
  monday: { morning: 4, afternoon: 4, evening: 4 },
  tuesday: { morning: 4, afternoon: 4, evening: 4 },
  wednesday: { morning: 4, afternoon: 4, evening: 4 },
  thursday: { morning: 4, afternoon: 4, evening: 4 },
  friday: { morning: 6, afternoon: 6, evening: 4 },
  saturday: { morning: 6, afternoon: 6, evening: 4 },
  sunday: { morning: 6, afternoon: 6, evening: 4 },
};

const HOLIDAY_OVERRIDE_CAPACITY = 6;

export interface CapacityRules {
  capacity: Record<string, Record<string, number>>;
  holiday_overrides?: Record<string, number>;
  is_holiday?: boolean;
  backup_capacity?: Record<string, Record<string, number>>;
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
    const { data: settings, error } = await supabase
      .from('capacity_settings')
      .select('*')
      .eq('week_starting', weekStarting)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (!settings) {
      const defaultRules: CapacityRules = {
        capacity: DEFAULT_CAPACITIES,
        is_holiday: false,
        holiday_overrides: {},
      };

      return Response.json(
        {
          data: {
            rules: defaultRules,
            week_starting: weekStarting,
          },
        },
        { status: 200 }
      );
    }

    return Response.json(
      { data: settings },
      { status: 200 }
    );
  } catch (err) {
    console.error('Failed to fetch capacity settings:', err);
    return Response.json(
      { error: 'Failed to fetch capacity settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return Response.json(
    { error: 'POST not implemented for capacity settings' },
    { status: 501 }
  );
}

export async function PUT(request: Request) {
  return Response.json(
    { error: 'PUT not implemented for capacity settings' },
    { status: 501 }
  );
}
