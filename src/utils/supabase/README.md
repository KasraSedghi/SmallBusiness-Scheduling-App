# Authentication System

This directory contains all Supabase authentication utilities for the Red Bean Scheduler.

## Files

### `client.ts` — Browser-side Supabase Client
- Used only in client components (marked with `'use client'`)
- Provides direct access to Supabase API from the browser
- Should NOT be used in Server Components or API routes

**Usage:**
```typescript
'use client';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();
const { data, error } = await supabase.from('profiles').select();
```

### `server.ts` — Server-side Supabase Client
- Used in Server Components and API routes
- Automatically manages auth cookies for session persistence
- Handles server-side session refresh

**Usage:**
```typescript
import { createClient } from '@/utils/supabase/server';

const supabase = await createClient();
const { data, error } = await supabase.from('profiles').select();
```

### `auth.ts` — High-Level Auth Functions
- Wrapper functions for common auth operations
- All return `{ data, error }` format for consistency
- Includes password strength validation

**Available Functions:**
- `signUpWithEmail(email, password)` — Register new user with email/password
- `signInWithEmail(email, password)` — Login with email/password
- `signInWithGoogle()` — Get Google OAuth redirect URL
- `signOut()` — Logout current user
- `getCurrentUser()` — Fetch authenticated user's profile

**Usage:**
```typescript
import { signUpWithEmail, signInWithGoogle } from '@/utils/supabase/auth';

// Email signup
const { data, error } = await signUpWithEmail('user@example.com', 'Password123');

// Google OAuth
const { data: oauth, error: oauthError } = await signInWithGoogle();
window.location.href = oauth?.url;
```

## Authentication Flow

### Email/Password Registration
1. User enters email and password on `/login` page
2. Frontend calls `signUpWithEmail()` which:
   - Validates password (8+ chars, 1 uppercase, 1 number)
   - Creates auth user in Supabase Auth
   - Creates profile record in `profiles` table with role='employee'
3. Supabase sends confirmation email
4. User returns from email link → `/api/auth/callback`
5. Session is established
6. User is redirected to `/availability`

### Email/Password Login
1. User enters credentials on `/login`
2. Frontend calls `signInWithEmail()`
3. Session is established
4. User is redirected based on role (admin → `/admin/dashboard`, employee → `/availability`)

### Google OAuth
1. User clicks "Sign in with Google"
2. Frontend calls `signInWithGoogle()` and redirects to Google
3. Google redirects back to `/api/auth/callback` with authorization code
4. Server exchanges code for session
5. **Account Linking**: If email matches existing profile, uses that profile. Otherwise creates new profile.
6. Session is established
7. User is redirected based on role

## Middleware Protection

[src/middleware.ts](../../middleware.ts) provides global route protection:

**Public Routes** (no auth required):
- `/` — Role selection portal
- `/login` — Login/signup page

**Protected Routes** (auth required):
- `/availability` — Employee availability form (employee + admin)
- `/admin/dashboard` — Admin dashboard (admin only)

**Behavior:**
- Session is automatically refreshed on every request
- Unauthenticated users are redirected to `/`
- Users without role access are redirected to `/`
- Role check queries the `profiles` table to verify current user's role

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter (A-Z)
- At least one number (0-9)

Examples:
- ✅ `Password123`
- ✅ `MyP@ss1`
- ❌ `password123` (no uppercase)
- ❌ `Password` (no number)
- ❌ `Pass1` (too short)

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-public-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Session Management

- Sessions are stored in cookies (managed by Supabase SSR)
- Cookies are automatically refreshed on every request via middleware
- Session persists across browser tabs and restarts
- Logout clears the session cookie

## Account Linking Behavior

When a user signs in with Google:
1. If their email matches an existing profile → session uses that profile's role
2. If their email is new → a new profile is created with role='employee'

This allows users to:
- Sign up with email/password as employee
- Later sign in with their Google account and access the same profile
- Seamlessly switch between auth methods

## Type Safety

All interactions are fully typed with:
- `Database` type for table schemas
- `AuthResponse<T>` for consistent error handling
- TypeScript interfaces for all returned data

## Security Notes

✅ **What's protected:**
- All cookies are `httpOnly` (not accessible from JavaScript)
- Session tokens are never exposed to the browser
- RLS policies enforce data isolation at database level
- Password validation on signup (frontend + backend via Supabase)

⚠️ **What you still need:**
- Rate limiting on `/login` and `/api/auth/callback` (TODO: Feature 3)
- Email verification checks before allowing schedule submissions (TODO: Feature 4)
- Audit logging for sensitive operations
