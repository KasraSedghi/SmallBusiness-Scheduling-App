import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(errorDescription || error)}`,
        request.url
      )
    );
  }

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=No+authorization+code', request.url));
  }

  const supabase = await createClient();

  // Exchange code for session
  const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

  if (authError || !authData.user) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(authError?.message || 'Auth exchange failed')}`,
        request.url
      )
    );
  }

  const user = authData.user;
  const userEmail = user.email;

  if (!userEmail) {
    return NextResponse.redirect(
      new URL('/login?error=No+email+from+auth+provider', request.url)
    );
  }

  // Check if profile exists for this email (account linking)
  const { data: existingProfile, error: lookupError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('email', userEmail)
    .single();

  let profileId = user.id;
  let userRole = 'employee';

  // If profile exists with same email, use it (account linking scenario)
  if (existingProfile) {
    profileId = existingProfile.id;
    userRole = existingProfile.role;
  } else if (!lookupError || lookupError.code === 'PGRST116') {
    // PGRST116 = no rows found, which is expected for new signups
    // Create new profile for first-time user
    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      email: userEmail,
      role: 'employee', // Default role for new users
      avatar_url: null,
    });

    if (insertError) {
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent('Failed to create profile')}`,
          request.url
        )
      );
    }
    userRole = 'employee';
  } else {
    // Unexpected database error
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent(lookupError.message || 'Profile lookup failed')}`,
        request.url
      )
    );
  }

  // Redirect based on role
  const redirectUrl = userRole === 'admin' ? '/admin/dashboard' : '/availability';

  const response = NextResponse.redirect(new URL(redirectUrl, request.url));

  return response;
}
