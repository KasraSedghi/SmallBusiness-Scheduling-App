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

  // Create profile for new user (always employee role)
  try {
    const profileData: any = {
      id: data.user.id,
      email,
      role: 'employee', // Always employee - admin accounts created separately
      avatar_url: null,
    };
    await supabase.from('profiles').insert(profileData);
  } catch (profileError) {
    console.error('Failed to create profile:', profileError);
    return { data: null, error: 'Failed to create user profile' };
  }

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

export async function signInWithGoogle(): Promise<AuthResponse<{ url: string }>> {
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
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
