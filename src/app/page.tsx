'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserProfile } from '@/utils/supabase/auth';

export default function PortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

    const routeUser = async () => {
      try {
        const startTime = performance.now();

        // First confirm there is an authenticated session at all. Without one,
        // send the user to login rather than spinning forever.
        const userResult = await getCurrentUser();
        if (userResult.error || !userResult.data) {
          router.push('/login');
          return;
        }

        // For a just-signed-up account the profile row is created by the
        // on_auth_user_created trigger and may not be readable on the very
        // first query (a small replication/commit race). Retry a few times
        // before giving up so the portal never dead-ends on the spinner.
        let profile = null;
        for (let attempt = 0; attempt < 5; attempt++) {
          const result = await getUserProfile();
          if (result.data) {
            profile = result.data;
            break;
          }
          await sleep(400);
        }

        const routeTime = performance.now() - startTime;

        if (profile?.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          // Authenticated but profile still unresolved → default to the
          // employee view (the trigger always provisions employees). The
          // availability page re-checks auth on its own.
          router.push('/availability');
        }

        console.log(`[Portal] Routed ${profile?.role ?? 'employee'} user in ${routeTime.toFixed(0)}ms`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Portal routing error:', err);
        setError(errorMsg);
        setLoading(false);
      }
    };

    // Hard safety net: never let the splash hang indefinitely.
    const timeout = setTimeout(() => {
      setError('This is taking longer than expected. Please sign in again.');
      setLoading(false);
    }, 12000);

    routeUser().finally(() => clearTimeout(timeout));
  }, [router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-linear-to-br from-brand-deep to-brand px-4">
      {/* Ambient brand glow */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(245,230,211,0.10)_0%,transparent_70%)] blur-3xl" />

      <div className="relative z-10 max-w-md text-center">
        {loading && !error && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cream-white/10 shadow-lg backdrop-blur-sm">
              <span className="animate-pulse text-3xl">🫘</span>
            </div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-cream-white sm:text-3xl">
              The Red Bean
            </h1>
            <p className="text-sm font-light tracking-wide text-cream">Preparing your portal…</p>
            <div className="mx-auto mt-6 h-1 w-32 overflow-hidden rounded-full bg-cream-white/15">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-cream-white/70" />
            </div>
          </>
        )}

        {error && (
          <>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-cream-white/10 backdrop-blur-sm">
              <svg
                className="h-8 w-8 text-cream-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="mb-2 text-2xl font-semibold tracking-tight text-cream-white sm:text-3xl">
              Something went wrong
            </h1>
            <p className="mb-6 text-sm font-light text-cream">{error}</p>
            <button
              onClick={() => (window.location.href = '/login')}
              className="rounded-xl bg-cream-white px-6 py-2.5 font-medium text-brand shadow-md transition-all duration-200 hover:bg-cream active:scale-[0.98]"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
