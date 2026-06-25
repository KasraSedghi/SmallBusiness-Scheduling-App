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
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-red-bean to-dark-crimson px-4">
      <div className="text-center max-w-md">
        {loading && !error && (
          <>
            <div className="w-16 h-16 border-4 border-light-cream border-t-white-cream rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white-cream mb-2">
              Red Bean Scheduler
            </h1>
            <p className="text-light-cream">Preparing your portal...</p>
          </>
        )}

        {error && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-white-cream"
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white-cream mb-2">
              Oops!
            </h1>
            <p className="text-light-cream mb-6">{error}</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-6 py-2 bg-white-cream text-red-bean font-semibold rounded-lg hover:bg-light-cream transition"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
