import type { Database } from '@/types/database';

export const mockProfile: Database['public']['Tables']['profiles']['Row'] = {
  id: 'test-uuid-1',
  email: 'employee@example.com',
  role: 'employee',
  avatar_url: null,
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
};

export const mockAdminProfile: Database['public']['Tables']['profiles']['Row'] = {
  id: 'test-uuid-admin',
  email: 'admin@example.com',
  role: 'admin',
  avatar_url: null,
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
};

export const mockAvailability: Database['public']['Tables']['availabilities']['Row'] = {
  id: 'avail-uuid-1',
  profile_id: 'test-uuid-1',
  week_starting: '2026-06-21',
  shift_data: {
    sunday: { morning: true, afternoon: false },
    monday: { morning: true, afternoon: true },
    tuesday: { morning: false, afternoon: true },
    wednesday: { morning: true, afternoon: false },
    thursday: { morning: true, afternoon: true },
    friday: { morning: false, afternoon: false },
    saturday: { morning: false, afternoon: false },
  },
  status: 'pending',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
};

export const mockApprovedAvailability: Database['public']['Tables']['availabilities']['Row'] = {
  ...mockAvailability,
  id: 'avail-uuid-2',
  status: 'approved',
};

export const mockTimeOffRequest: Database['public']['Tables']['time_off_requests']['Row'] = {
  id: 'timeoff-uuid-1',
  profile_id: 'test-uuid-1',
  start_date: '2026-07-01',
  end_date: '2026-07-05',
  status: 'pending',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
};

export const mockCapacitySettings: Database['public']['Tables']['capacity_settings']['Row'] = {
  id: 'capacity-uuid-1',
  week_starting: '2026-06-21',
  rules: {
    capacity: {
      sunday: { morning: 2, afternoon: 3 },
      monday: { morning: 3, afternoon: 3 },
      tuesday: { morning: 3, afternoon: 3 },
      wednesday: { morning: 3, afternoon: 3 },
      thursday: { morning: 3, afternoon: 3 },
      friday: { morning: 2, afternoon: 2 },
      saturday: { morning: 2, afternoon: 2 },
    },
    holiday_overrides: {},
  },
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
};

export const mockAuthUser = {
  id: 'test-uuid-1',
  email: 'employee@example.com',
  email_confirmed_at: '2026-06-20T00:00:00Z',
  phone: null,
  confirmed_at: '2026-06-20T00:00:00Z',
  last_sign_in_at: '2026-06-20T12:00:00Z',
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {},
  identities: null,
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
};

export const mockGoogleAuthUser = {
  ...mockAuthUser,
  id: 'google-uuid-1',
  app_metadata: {
    provider: 'google',
    providers: ['google'],
  },
};
