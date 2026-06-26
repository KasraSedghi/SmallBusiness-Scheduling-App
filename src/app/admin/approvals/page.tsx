'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getUserProfile, signOut } from '@/utils/supabase/auth';
import { getWeekStartingDate } from '@/utils/shift-helpers';
import { Availability } from '@/types';
import AvatarDisplay from '@/components/ui/AvatarDisplay';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SHIFT_TYPES = ['morning', 'afternoon', 'evening'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu',
  friday: 'Fri', saturday: 'Sat', sunday: 'Sun',
};
const SHIFT_CHIP_CLASSES: Record<string, string> = {
  morning: 'bg-shift-morning text-cream-white',
  afternoon: 'bg-shift-afternoon text-cream-white',
  evening: 'bg-shift-evening text-cream-white',
};

export default function ApprovalsQueuePage() {
  const router = useRouter();
  const weekStarting = getWeekStartingDate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<(Availability & { profile?: any })[]>([]);
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    try {
      const profileResult = await getUserProfile();
      if (!profileResult.data) {
        router.push('/login');
        return;
      }
      if (profileResult.data.role !== 'admin') {
        router.push('/availability?error=unauthorized');
        return;
      }

      const res = await fetch(`/api/admin/availability?week_starting=${weekStarting}`);
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to load submissions');
      }

      setPending(
        (json.data.availabilities || []).filter((a: Availability) => a.status === 'pending')
      );
    } catch (err) {
      console.error('Failed to load approvals queue:', err);
      setError('Failed to load approvals queue');
    } finally {
      setLoading(false);
    }
  }, [router, weekStarting]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDecision = (id: string, decision: 'approve' | 'disapprove') => {
    setDismissingIds((prev) => new Set(prev).add(id));

    const mutate =
      decision === 'approve'
        ? fetch('/api/admin/availability', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: 'approved' }),
          })
        : fetch('/api/admin/availability', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
          });

    mutate.catch((err) => console.error(`Failed to ${decision} availability:`, err));

    setTimeout(() => {
      setPending((prev) => prev.filter((a) => a.id !== id));
      setDismissingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 300);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-brand"></div>
          <p className="text-ink-soft">Loading approvals queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="flex h-screen w-72 shrink-0 flex-col justify-between border-r border-border-dark bg-surface-dark p-7 text-ink-on-dark">
        <div>
          <div className="mb-10 flex items-center gap-3">
            <span className="text-3xl">🫘</span>
            <div>
              <p className="text-lg font-bold leading-tight">The Red Bean</p>
              <p className="text-sm font-light text-ink-on-dark-muted">Admin Console</p>
            </div>
          </div>

          <nav className="space-y-2">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-4 rounded-xl px-4 py-3.5 text-base font-semibold text-ink-on-dark-muted transition-colors hover:bg-border-dark/60 hover:text-ink-on-dark"
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Roster Dashboard
            </Link>
            <div className="flex items-center gap-4 rounded-xl bg-border-dark px-4 py-3.5 text-base font-semibold text-ink-on-dark">
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Approvals Queue
              {pending.length > 0 && (
                <span className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-full bg-brand px-1.5 text-xs font-bold text-cream-white">
                  {pending.length}
                </span>
              )}
            </div>
            <Link
              href="/admin/capacity"
              className="flex items-center gap-4 rounded-xl px-4 py-3.5 text-base font-semibold text-ink-on-dark-muted transition-colors hover:bg-border-dark/60 hover:text-ink-on-dark"
            >
              <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capacity Settings
            </Link>
          </nav>
        </div>

        <div className="space-y-3">
          <button
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="w-full rounded-xl px-4 py-3 text-base font-semibold text-ink-on-dark-muted transition-colors hover:bg-border-dark hover:text-ink-on-dark active:scale-[0.98]"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-x-auto bg-surface/50 p-8">
        <h1 className="mb-1 text-3xl font-bold text-ink">Approvals Queue</h1>
        <p className="mb-6 text-sm text-ink-muted">
          Review pending submissions for this week. Approving or disapproving removes the row immediately.
        </p>

        {error && (
          <div className="mb-5 rounded-xl border border-brand/15 bg-brand-deep/5 p-4">
            <p className="text-sm font-medium text-brand">{error}</p>
          </div>
        )}

        {pending.length === 0 ? (
          <div className="panel flex flex-col items-center gap-2 p-12 text-center">
            <svg className="h-10 w-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-base font-semibold text-ink">All caught up</p>
            <p className="text-sm text-ink-muted">There are no pending submissions for this week.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((avail) => {
              const isDismissing = dismissingIds.has(avail.id);
              return (
                <div
                  key={avail.id}
                  className={`panel flex flex-col gap-4 p-5 transition-all duration-300 sm:flex-row sm:items-center sm:justify-between ${
                    isDismissing ? 'translate-x-6 opacity-0' : 'translate-x-0 opacity-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AvatarDisplay
                      email={avail.profile?.email || 'Unknown Employee'}
                      avatarUrl={avail.profile?.avatar_url}
                      size="sm"
                    />
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {avail.profile?.email || 'Unknown Employee'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {DAYS_OF_WEEK.flatMap((day) =>
                          SHIFT_TYPES.filter((shift) => (avail.shift_data as any)[day]?.[shift]).map((shift) => (
                            <span
                              key={`${day}-${shift}`}
                              className={`rounded-md px-2 py-0.5 text-[10px] font-semibold capitalize ${SHIFT_CHIP_CLASSES[shift]}`}
                            >
                              {DAY_LABELS[day]} {shift}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecision(avail.id, 'approve')}
                      disabled={isDismissing}
                      className="rounded-xl bg-success px-4 py-2 text-sm font-semibold text-cream-white transition-all duration-150 hover:bg-success/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleDecision(avail.id, 'disapprove')}
                      disabled={isDismissing}
                      className="rounded-xl border border-danger/40 bg-transparent px-4 py-2 text-sm font-semibold text-danger transition-all duration-150 hover:bg-danger/10 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Disapprove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
