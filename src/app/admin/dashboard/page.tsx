'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import RosterGrid from '@/components/modules/RosterGrid';
import { getUserProfile, signOut } from '@/utils/supabase/auth';
import { getWeekStartingDate } from '@/utils/shift-helpers';
import { Availability, TimeOffRequest, CapacityRules } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const weekStarting = getWeekStartingDate();

  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [availabilities, setAvailabilities] = useState<(Availability & { profile?: any })[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [capacityRules, setCapacityRules] = useState<CapacityRules['capacity']>(
    {} as CapacityRules['capacity']
  );

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

      const [availRes, capacityRes] = await Promise.all([
        fetch(`/api/admin/availability?week_starting=${weekStarting}`),
        fetch(`/api/admin/capacity?week_starting=${weekStarting}`),
      ]);

      const availJson = await availRes.json();
      const capacityJson = await capacityRes.json();

      if (!availRes.ok || availJson.error) {
        throw new Error(availJson.error || 'Failed to load availabilities');
      }
      if (!capacityRes.ok || capacityJson.error) {
        throw new Error(capacityJson.error || 'Failed to load capacity settings');
      }

      setAvailabilities(availJson.data.availabilities || []);
      setTimeOffRequests(availJson.data.time_off_requests || []);
      setCapacityRules(
        (capacityJson.data.rules || capacityJson.data)?.capacity || ({} as CapacityRules['capacity'])
      );
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [router, weekStarting]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprovalChange = async (availabilityId: string, newStatus: string) => {
    setError(null);
    try {
      const res = await fetch('/api/admin/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: availabilityId, status: newStatus }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to update availability');
      }

      setAvailabilities((prev) =>
        prev.map((a) => (a.id === availabilityId ? { ...a, status: newStatus as any } : a))
      );
      setSuccessMessage('Availability approved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update availability:', err);
      setError('Failed to update availability. Please try again.');
    }
  };

  const handlePublish = async () => {
    setError(null);
    setPublishing(true);

    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ week_starting: weekStarting }),
      });
      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to publish schedule');
      }

      setSuccessMessage(json.data.message);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to publish schedule:', err);
      setError('Failed to publish schedule');
    } finally {
      setPublishing(false);
    }
  };

  const approvedCount = availabilities.filter((a) => a.status === 'approved').length;
  const pendingCount = availabilities.filter((a) => a.status === 'pending').length;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-brand"></div>
          <p className="text-ink-soft">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Sidebar */}
      <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-border-dark bg-surface-dark p-6 text-ink-on-dark">
        <div>
          <div className="mb-8 flex items-center gap-2">
            <span className="text-2xl">🫘</span>
            <div>
              <p className="text-sm font-semibold leading-tight">The Red Bean</p>
              <p className="text-xs font-light text-ink-on-dark-muted">Admin Console</p>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="flex items-center gap-3 rounded-lg bg-border-dark px-3 py-2 text-sm font-medium text-ink-on-dark">
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              Roster Dashboard
            </div>
            <Link
              href="/admin/capacity"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-ink-on-dark-muted transition-colors hover:bg-border-dark/60 hover:text-ink-on-dark"
            >
              <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Capacity Settings
            </Link>
          </nav>

          <div className="mt-8 rounded-xl border border-border-dark bg-border-dark/50 p-4">
            <p className="text-xs uppercase tracking-wider text-ink-on-dark-muted">Week of</p>
            <p className="mt-1 text-sm font-semibold text-ink-on-dark">
              {new Date(weekStarting).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-ink-on-dark-muted">Approved</span>
              <span className="font-semibold text-ink-on-dark">{approvedCount}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-ink-on-dark-muted">Pending</span>
              <span className="font-semibold text-ink-on-dark">{pendingCount}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handlePublish}
            disabled={publishing || availabilities.length === 0}
            className={`w-full rounded-xl px-6 py-3 text-sm font-medium shadow-md shadow-brand-deep/10 transition-all duration-200 active:scale-[0.98] ${
              publishing || availabilities.length === 0
                ? 'cursor-not-allowed bg-border-dark text-ink-on-dark-muted'
                : 'bg-linear-to-r from-brand-deep to-brand text-cream-white hover:from-brand'
            }`}
          >
            {publishing ? 'Publishing...' : 'Publish Schedule'}
          </button>
          <button
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium text-ink-on-dark-muted transition-colors hover:bg-border-dark hover:text-ink-on-dark"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main tracking dashboard */}
      <main className="flex-1 overflow-x-auto bg-surface/50 p-8">
        <h1 className="mb-1 text-2xl font-semibold text-ink">Roster Matrix</h1>
        <p className="mb-6 text-sm text-ink-muted">
          Review submissions, approve coverage, and publish the final week's roster.
        </p>

        {/* Stats overview */}
        <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Submissions',
              value: availabilities.length,
              hint: 'this week',
              iconClass: 'bg-brand/10 text-brand',
              icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
            },
            {
              label: 'Pending Review',
              value: pendingCount,
              hint: 'awaiting approval',
              iconClass: 'bg-warning/10 text-warning',
              icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
            },
            {
              label: 'Approved',
              value: approvedCount,
              hint: 'ready to publish',
              iconClass: 'bg-success/10 text-success',
              icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
            },
            {
              label: 'Coverage',
              value: availabilities.length
                ? `${Math.round((approvedCount / availabilities.length) * 100)}%`
                : '—',
              hint: 'approved share',
              iconClass: 'bg-coffee/10 text-coffee',
              icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-border/60 bg-white p-5 shadow-sm transition-shadow duration-200 hover:shadow-md"
            >
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconClass}`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <div className="text-2xl font-semibold text-ink">{stat.value}</div>
              <div className="mt-0.5 text-sm font-medium text-ink-soft">{stat.label}</div>
              <div className="text-xs text-ink-faint">{stat.hint}</div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-5 rounded-xl border border-brand/15 bg-brand-deep/5 p-4">
            <p className="text-sm font-medium text-brand">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-xl border border-success/15 bg-success/5 p-4">
            <p className="text-sm font-medium text-success">{successMessage}</p>
          </div>
        )}

        <RosterGrid
          availabilities={availabilities}
          capacityRules={capacityRules}
          timeOffRequests={timeOffRequests}
          weekStarting={weekStarting}
          onApprovalChange={handleApprovalChange}
        />
      </main>
    </div>
  );
}
