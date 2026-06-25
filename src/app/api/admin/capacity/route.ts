import { createClient } from '@/utils/supabase/server';
import { requireAdmin } from '@/utils/supabase/admin-guard';
import { getWeekStartingDate } from '@/utils/shift-helpers';

const DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

const HOLIDAY_OVERRIDE_CAPACITY = 6;

export interface CapacityRules {
  capacity: Record<string, Record<string, number>>;
  holiday_overrides?: Record<string, number>;
  is_holiday?: boolean;
  backup_capacity?: Record<string, Record<string, number>>;
}

/**
 * Returns a fresh copy of the default weekly staffing capacities.
 * Weekdays (Mon-Thu) need 4 staff per shift; weekend days (Fri-Sun) need
 * 6 for the busier morning/afternoon and 4 for evening. A new object is
 * returned each call so callers can mutate it without shared-reference bugs.
 */
export function createDefaultCapacities(): Record<string, Record<string, number>> {
  return {
    monday: { morning: 4, afternoon: 4, evening: 4 },
    tuesday: { morning: 4, afternoon: 4, evening: 4 },
    wednesday: { morning: 4, afternoon: 4, evening: 4 },
    thursday: { morning: 4, afternoon: 4, evening: 4 },
    friday: { morning: 6, afternoon: 6, evening: 4 },
    saturday: { morning: 6, afternoon: 6, evening: 4 },
    sunday: { morning: 6, afternoon: 6, evening: 4 },
  };
}

/**
 * Returns a fresh copy of the holiday-override capacities: every shift on
 * every day is staffed to the holiday level (6). Used when an admin toggles
 * a week into "holiday" mode. Returns a new object each call.
 */
export function createHolidayOverrideCapacities(): Record<string, Record<string, number>> {
  const capacities: Record<string, Record<string, number>> = {};
  for (const day of DAYS) {
    capacities[day] = {
      morning: HOLIDAY_OVERRIDE_CAPACITY,
      afternoon: HOLIDAY_OVERRIDE_CAPACITY,
      evening: HOLIDAY_OVERRIDE_CAPACITY,
    };
  }
  return capacities;
}

const DEFAULT_CAPACITIES = createDefaultCapacities();

export async function GET(request: Request) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
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

/**
 * Validates that a capacity map covers all 7 days with non-negative integer
 * counts for morning/afternoon/evening. Returns an error string, or null if valid.
 */
function validateCapacity(
  capacity: unknown
): string | null {
  if (!capacity || typeof capacity !== 'object') {
    return 'capacity must be an object';
  }
  const cap = capacity as Record<string, Record<string, number>>;
  for (const day of DAYS) {
    const shifts = cap[day];
    if (!shifts || typeof shifts !== 'object') {
      return `Missing capacity for ${day}`;
    }
    for (const shift of ['morning', 'afternoon', 'evening'] as const) {
      const value = shifts[shift];
      if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
        return `Invalid ${shift} capacity for ${day}`;
      }
    }
  }
  return null;
}

/**
 * POST /api/admin/capacity
 * Create or update the capacity settings for a given week.
 * Body: { week_starting?: string, rules: CapacityRules }
 */
export async function POST(request: Request) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.rules) {
      return Response.json({ error: 'Missing rules in request body' }, { status: 400 });
    }

    const rules = body.rules as CapacityRules;
    const validationError = validateCapacity(rules.capacity);
    if (validationError) {
      return Response.json({ error: validationError }, { status: 400 });
    }

    const weekStarting = body.week_starting || getWeekStartingDate();
    const supabase = await createClient();

    const { data, error } = await (supabase.from('capacity_settings') as any)
      .upsert(
        { week_starting: weekStarting, rules },
        { onConflict: 'week_starting' }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Failed to save capacity settings:', err);
    return Response.json(
      { error: 'Failed to save capacity settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/capacity
 * Toggle a week into or out of "holiday" mode. Turning holiday mode ON backs
 * up the current capacity and applies the holiday override; turning it OFF
 * restores the backed-up capacity.
 * Body: { week_starting?: string, is_holiday: boolean }
 */
export async function PUT(request: Request) {
  try {
    const { authorized } = await requireAdmin();
    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.is_holiday !== 'boolean') {
      return Response.json({ error: 'Missing is_holiday flag in request body' }, { status: 400 });
    }

    const weekStarting = body.week_starting || getWeekStartingDate();
    const supabase = await createClient();

    const { data: existing, error: fetchError } = await (supabase.from('capacity_settings') as any)
      .select('*')
      .eq('week_starting', weekStarting)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      throw fetchError;
    }

    const currentRules: CapacityRules = existing?.rules || {
      capacity: createDefaultCapacities(),
      is_holiday: false,
    };

    let nextRules: CapacityRules;
    if (body.is_holiday) {
      // Back up the current capacity, then apply the holiday override.
      nextRules = {
        capacity: createHolidayOverrideCapacities(),
        is_holiday: true,
        backup_capacity: currentRules.capacity,
      };
    } else {
      // Restore the backed-up capacity (or defaults if none was stored).
      nextRules = {
        capacity: currentRules.backup_capacity || createDefaultCapacities(),
        is_holiday: false,
      };
    }

    const { data, error } = await (supabase.from('capacity_settings') as any)
      .upsert(
        { week_starting: weekStarting, rules: nextRules },
        { onConflict: 'week_starting' }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ data }, { status: 200 });
  } catch (err) {
    console.error('Failed to toggle holiday capacity:', err);
    return Response.json(
      { error: 'Failed to toggle holiday capacity' },
      { status: 500 }
    );
  }
}
