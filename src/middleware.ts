import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/types/database';

// Routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/'];

// Role-based route protection
const PROTECTED_ROUTES: Record<string, string[]> = {
  '/availability': ['employee', 'admin'],
  '/admin/dashboard': ['admin'],
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        getAll() {
          const cookies = parseCookieHeader(request.headers.get('cookie') || '');
          return cookies.map((cookie) => ({
            name: cookie.name,
            value: cookie.value || '',
          }));
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if it exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if route is public
  if (PUBLIC_ROUTES.includes(pathname)) {
    return response;
  }

  // Protect all other routes
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Check role-based access for protected routes
  for (const [route, allowedRoles] of Object.entries(PROTECTED_ROUTES)) {
    if (pathname.startsWith(route)) {
      if (!user.email) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', user.email)
        .single();

      if (!profile || !allowedRoles.includes((profile as any).role)) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)',
  ],
};
