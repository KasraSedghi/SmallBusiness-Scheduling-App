import { createClient } from './client';
import { validatePassword } from '@/utils/validation';

export interface AuthResponse<T> {
  data: T | null;
  error: string | null;
}

export async function signUpWithEmail(
  email: string,
  password: string
): Promise<AuthResponse<{ id: string; email: string }>> {
  // Validate password strength
  const validation = validatePassword(password);
  if (!validation.isValid) {
    return { data: null, error: validation.errors.join('; ') };
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data.user) {
    return { data: null, error: 'Signup failed: no user returned' };
  }

  // Profile row is created server-side by the on_auth_user_created trigger
  // (see supabase/migrations/006_handle_new_user_trigger.sql), since RLS
  // would otherwise block this insert until the user confirms their email.

  return {
    data: { id: data.user.id, email: data.user.email || email },
    error: null,
  };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResponse<{ id: string; email: string }>> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data.user) {
    return { data: null, error: 'Sign in failed: no user returned' };
  }

  return {
    data: { id: data.user.id, email: data.user.email || email },
    error: null,
  };
}

export async function signInWithGoogle(
  accessCode?: string
): Promise<AuthResponse<{ url: string }>> {
  const supabase = createClient();

  const redirectTo = accessCode
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?access_code=${encodeURIComponent(accessCode)}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      scopes: 'email profile',
    },
  });

  if (error) {
    return { data: null, error: error.message };
  }

  if (!data.url) {
    return { data: null, error: 'Failed to generate Google OAuth URL' };
  }

  return { data: { url: data.url }, error: null };
}

export async function signOut(): Promise<AuthResponse<null>> {
  const supabase = createClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: null, error: null };
}

export async function getCurrentUser() {
  const supabase = createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { data: null, error: error?.message || 'Not authenticated' };
  }

  return { data: user, error: null };
}

export async function getUserProfile() {
  const supabase = createClient();

  const userResult = await getCurrentUser();
  if (userResult.error || !userResult.data) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('id', userResult.data.id)
    .single();

  if (error) {
    return { data: null, error: error.message };
  }

  return { data: profile as { id: string; email: string; role: 'employee' | 'admin' }, error: null };
}
