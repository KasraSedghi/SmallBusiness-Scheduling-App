'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUserProfile } from '@/utils/supabase/auth';

export default function PortalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const routeUser = async () => {
      try {
        const startTime = performance.now();
        const result = await getUserProfile();

        if (result.error || !result.data) {
          router.push('/login');
          return;
        }

        const endTime = performance.now();
        const routeTime = endTime - startTime;

        if (result.data.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/availability');
        }

        console.log(`[Portal] Routed ${result.data.role} user in ${routeTime.toFixed(0)}ms`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('Portal routing error:', err);
        setError(errorMsg);
        setLoading(false);
      }
    };

    routeUser();
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
