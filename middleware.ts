import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient, parseCookieHeader, serializeCookieHeader } from '@supabase/ssr';
import type { Database } from '@/types/database';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const cookies = parseCookieHeader(request.headers.get('cookie') ?? '');
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        cookies: {
          getAll() {
            return cookies.map((c) => ({ ...c, value: c.value || '' }));
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Protect admin routes
    if (pathname.startsWith('/admin')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }

      // Get user's profile to check role
      const { data: profile } = await (supabase.from('profiles') as any)
        .select('role')
        .eq('id', user.id)
        .single();

      if (!profile || (profile as any).role !== 'admin') {
        // Redirect non-admin users to availability page
        const url = new URL('/availability', request.url);
        url.searchParams.set('error', 'unauthorized');
        return NextResponse.redirect(url);
      }
    }

    // Protect employee routes
    if (pathname.startsWith('/availability')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }
  } catch (err) {
    console.error('Middleware error:', err);
    if (pathname.startsWith('/admin') || pathname.startsWith('/availability')) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/availability/:path*',
  ],
};
