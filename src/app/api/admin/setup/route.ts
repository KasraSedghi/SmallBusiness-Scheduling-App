import { NextRequest, NextResponse } from 'next/server';
import { adminAccountExists, ADMIN_SETUP_INSTRUCTIONS } from '@/utils/supabase/admin-setup';

/**
 * GET /api/admin/setup
 * Check if admin account exists and provide setup instructions
 * Public endpoint (no auth required) - only provides status
 */
export async function GET(request: NextRequest) {
  try {
    const exists = await adminAccountExists();

    if (exists) {
      return NextResponse.json(
        {
          status: 'ready',
          message: 'Admin account is already set up',
          email: 'admin@redbean.com',
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        status: 'not_configured',
        message: 'Admin account needs to be set up',
        instructions: ADMIN_SETUP_INSTRUCTIONS,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin setup check error:', error);
    return NextResponse.json(
      { error: 'Failed to check admin status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/setup
 * Setup endpoint - requires ADMIN_SETUP_SECRET environment variable
 * This prevents unauthorized admin account creation
 *
 * Usage:
 * curl -X POST http://localhost:3000/api/admin/setup \
 *   -H "Content-Type: application/json" \
 *   -d '{"secret": "your_secret_key"}'
 *
 * Environment Variables:
 * ADMIN_SETUP_SECRET - Secret key to authorize setup (set during deployment)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if admin account already exists
    const exists = await adminAccountExists();
    if (exists) {
      return NextResponse.json(
        { error: 'Admin account already exists' },
        { status: 409 }
      );
    }

    // Parse request body
    const body = await request.json().catch(() => ({}));
    const providedSecret = body.secret || '';

    // Verify setup secret
    const setupSecret = process.env.ADMIN_SETUP_SECRET;
    if (!setupSecret || providedSecret !== setupSecret) {
      console.warn('[Admin Setup] Unauthorized setup attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // In production, admin account should be created via Supabase Dashboard
    // This endpoint just verifies the setup is needed
    return NextResponse.json(
      {
        status: 'instructions_provided',
        message: 'Follow the setup instructions to create admin account in Supabase Dashboard',
        instructions: ADMIN_SETUP_INSTRUCTIONS,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Admin setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed' },
      { status: 500 }
    );
  }
}
