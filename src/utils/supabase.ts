import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function for authenticated requests
export async function getSupabaseUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Standard response format
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export function createResponse<T>(
  data: T | null,
  error: string | null = null
): ApiResponse<T> {
  return { data, error };
}
