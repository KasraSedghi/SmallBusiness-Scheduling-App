import { createClient } from './client';

/**
 * Admin Account Setup Utility
 * Handles one-time initialization of the admin account
 * Email: admin@redbean.com
 * Username: Sedghi (reference only)
 * Password: SedghiAdmin1967@ (managed by Supabase Auth)
 */

const ADMIN_EMAIL = 'admin@redbean.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'SedghiAdmin1967@';

export interface AdminSetupResponse {
  success: boolean;
  message: string;
  userId?: string;
}

/**
 * Check if admin account already exists
 */
export async function adminAccountExists(): Promise<boolean> {
  const supabase = createClient();

  try {
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('id')
      .eq('email', ADMIN_EMAIL)
      .eq('role', 'admin')
      .single();

    return !!profile;
  } catch {
    return false;
  }
}

/**
 * Sign in as admin for validation/testing
 * Production: Use Supabase Dashboard to manage admin account
 */
export async function signInAsAdmin(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  if (email !== ADMIN_EMAIL) {
    return { success: false, error: 'Invalid admin email' };
  }

  const supabase = createClient();

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data.user) {
      return { success: false, error: 'Sign in failed' };
    }

    // Verify user has admin role
    const { data: profile } = await (supabase.from('profiles') as any)
      .select('role')
      .eq('id', data.user.id)
      .single();

    if ((profile as any)?.role !== 'admin') {
      return { success: false, error: 'User is not an admin' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: 'Sign in error' };
  }
}

/**
 * Get admin account info (does not return password)
 */
export async function getAdminInfo(): Promise<{
  exists: boolean;
  email?: string;
  message?: string;
}> {
  const exists = await adminAccountExists();

  if (!exists) {
    return {
      exists: false,
      message: 'Admin account not found. Please create it in Supabase Dashboard.',
    };
  }

  return {
    exists: true,
    email: ADMIN_EMAIL,
    message: 'Admin account is set up. Use admin@redbean.com to log in.',
  };
}

/**
 * Security note: Regular users cannot create admin accounts
 * The signUpWithEmail() function in auth.ts always sets role='employee'
 * Admin accounts can only be created via Supabase Dashboard or migration
 */
export function canUserCreateAdminAccount(role: string): boolean {
  // Only existing admins can create other admins (via Supabase Dashboard)
  return role === 'admin';
}

/**
 * Validate that new accounts are employees, not admins
 */
export function validateNewUserRole(role: string): boolean {
  // New users from signup can only be employees
  if (role !== 'employee') {
    console.warn(`Invalid role for new user: ${role}. Only 'employee' allowed.`);
    return false;
  }
  return true;
}

/**
 * Documentation for manual admin setup
 */
export const ADMIN_SETUP_INSTRUCTIONS = `
Admin Account Setup Instructions
=================================

The admin account is created separately from regular employee accounts.
This prevents accidental admin account creation through the signup form.

Manual Setup (Recommended):
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" button
3. Enter email: admin@redbean.com
4. Enter password: SedghiAdmin1967@
5. Confirm password
6. Click "Save"
7. Go to Supabase Dashboard → SQL Editor
8. Run this query:
   INSERT INTO profiles (id, email, role, created_at, updated_at)
   VALUES ('<user_id_from_step_6>', 'admin@redbean.com', 'admin', NOW(), NOW());
9. Admin account is now ready
10. Log in with: admin@redbean.com / SedghiAdmin1967@

Email: admin@redbean.com
Password: SedghiAdmin1967@
Username (reference): Sedghi

Security:
- Only email-based login for admin
- Password must be at least 8 characters
- Should enable 2FA in Supabase for admin account (if available)
- Keep admin credentials secure
- Consider rotating password periodically
`;
