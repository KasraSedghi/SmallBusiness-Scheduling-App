import { createClient } from './server';

export interface AdminGuardResult {
  authorized: boolean;
  userId: string | null;
}

/**
 * Server-side admin check for Route Handlers. Must use the server client
 * (cookie-based session, via next/headers) rather than the browser client —
 * the browser client has no session storage outside a browser and throws
 * when used in a server context. Role comes from profiles.role, not the
 * Supabase Auth User object (whose `role` field is the Postgres role, e.g.
 * "authenticated", not the app's employee/admin role).
 */
export async function requireAdmin(): Promise<AdminGuardResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, userId: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || (profile as { role: string }).role !== 'admin') {
    return { authorized: false, userId: user.id };
  }

  return { authorized: true, userId: user.id };
}
