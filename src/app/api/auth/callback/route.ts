import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

const SIGNUP_ACCESS_CODE = 'RedBean2007';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const accessCode = searchParams.get('access_code');
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

  // Check if profile exists for this user (account linking)
  const { data: existingProfile, error: lookupError } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .single();

  let userRole: 'employee' | 'admin' = 'employee';

  // If profile exists with same email, use it (account linking scenario)
  if (existingProfile) {
    userRole = (existingProfile as { id: string; role: string }).role as 'employee' | 'admin';
  } else if (!lookupError || lookupError.code === 'PGRST116') {
    // PGRST116 = no rows found, which is expected for new signups.
    // Require a valid staff access code before provisioning a brand new account.
    if (accessCode !== SIGNUP_ACCESS_CODE) {
      await supabase.auth.signOut();
      try {
        const adminClient = createAdminClient();
        await adminClient.auth.admin.deleteUser(user.id);
      } catch (cleanupError) {
        console.error('Failed to clean up unauthorized Google signup:', cleanupError);
      }
      return NextResponse.redirect(
        new URL(
          `/login?error=${encodeURIComponent('Invalid access code. Ask your manager for the staff signup code.')}`,
          request.url
        )
      );
    }

    // Create new profile for first-time user
    const profileData: any = {
      id: user.id,
      email: userEmail,
      role: 'employee',
      avatar_url: null,
    };

    const { error: insertError } = await supabase
      .from('profiles')
      .insert(profileData);

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
