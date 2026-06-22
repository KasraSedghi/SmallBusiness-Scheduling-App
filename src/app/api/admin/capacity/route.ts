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

      return Response.json({
        data: {
          week_starting: weekStarting,
          rules: defaultRules,
        },
      });
    }

    return Response.json({
      data: {
        id: (settings as any).id,
        week_starting: (settings as any).week_starting,
        rules: (settings as any).rules,
      },
    });
  } catch (err) {
    console.error('Failed to fetch capacity settings:', err);
    return Response.json({ error: 'Failed to fetch capacity settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user.data || user.data.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { week_starting, rules } = body;

    if (!week_starting || !rules) {
      return Response.json(
        { error: 'Missing required fields: week_starting, rules' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const insertData: any = {
      week_starting,
      rules,
    };

    const { data: newSettings, error } = await supabase
      .from('capacity_settings')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    return Response.json(
      {
        data: {
          id: (newSettings as any).id,
          week_starting: (newSettings as any).week_starting,
          rules: (newSettings as any).rules,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Failed to create capacity settings:', err);
    return Response.json({ error: 'Failed to create capacity settings' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user.data || user.data.role !== 'admin') {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { id, week_starting, rules } = body;

    if (!id || !week_starting || !rules) {
      return Response.json(
        { error: 'Missing required fields: id, week_starting, rules' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const updateData: any = {
      rules,
    };

    const { data: updated, error } = await supabase
      .from('capacity_settings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({
      data: {
        id: (updated as any).id,
        week_starting: (updated as any).week_starting,
        rules: (updated as any).rules,
      },
    });
  } catch (err) {
    console.error('Failed to update capacity settings:', err);
    return Response.json({ error: 'Failed to update capacity settings' }, { status: 500 });
  }
}

export function createDefaultCapacities(): Record<string, Record<string, number>> {
  return JSON.parse(JSON.stringify(DEFAULT_CAPACITIES));
}

export function createHolidayOverrideCapacities(): Record<string, Record<string, number>> {
  const overrideCapacities: Record<string, Record<string, number>> = {};

  Object.keys(DEFAULT_CAPACITIES).forEach((day) => {
    overrideCapacities[day] = {
      morning: HOLIDAY_OVERRIDE_CAPACITY,
      afternoon: HOLIDAY_OVERRIDE_CAPACITY,
      evening: HOLIDAY_OVERRIDE_CAPACITY,
    };
  });

  return overrideCapacities;
}
