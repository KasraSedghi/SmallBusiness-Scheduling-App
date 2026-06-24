'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import RosterGrid from '@/components/modules/RosterGrid';
import { getUserProfile } from '@/utils/supabase/auth';
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
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-red-900"></div>
          <p className="text-stone-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      {/* Sidebar */}
      <aside className="flex h-screen w-64 shrink-0 flex-col justify-between border-r border-stone-800 bg-stone-900 p-6 text-stone-100">
        <div>
          <div className="mb-8 flex items-center gap-2">
            <span className="text-2xl">🫘</span>
            <div>
              <p className="text-sm font-semibold leading-tight">The Red Bean</p>
              <p className="text-xs font-light text-stone-400">Admin Console</p>
            </div>
          </div>

          <nav className="space-y-1">
            <div className="rounded-lg bg-stone-800 px-3 py-2 text-sm font-medium text-stone-100">
              Roster Dashboard
            </div>
          </nav>

          <div className="mt-8 rounded-xl border border-stone-800 bg-stone-800/50 p-4">
            <p className="text-xs uppercase tracking-wider text-stone-400">Week of</p>
            <p className="mt-1 text-sm font-semibold text-stone-100">
              {new Date(weekStarting).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-stone-400">Approved</span>
              <span className="font-semibold text-stone-100">{approvedCount}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-stone-400">Pending</span>
              <span className="font-semibold text-stone-100">{pendingCount}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handlePublish}
            disabled={publishing || availabilities.length === 0}
            className={`w-full rounded-xl px-6 py-3 text-sm font-medium shadow-md shadow-red-950/10 transition-all duration-200 active:scale-[0.98] ${
              publishing || availabilities.length === 0
                ? 'cursor-not-allowed bg-stone-800 text-stone-500'
                : 'bg-linear-to-r from-red-950 to-red-900 text-stone-100 hover:from-red-900'
            }`}
          >
            {publishing ? 'Publishing...' : 'Publish Schedule'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="w-full rounded-lg px-3 py-2 text-sm font-medium text-stone-400 transition-colors hover:bg-stone-800 hover:text-stone-100"
          >
            Back to Home
          </button>
        </div>
      </aside>

      {/* Main tracking dashboard */}
      <main className="flex-1 overflow-x-auto bg-stone-50/50 p-8">
        <h1 className="mb-1 text-2xl font-semibold text-stone-800">Roster Matrix</h1>
        <p className="mb-6 text-sm text-stone-500">
          Review submissions, approve coverage, and publish the final week's roster.
        </p>

        {error && (
          <div className="mb-5 rounded-xl border border-red-900/15 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-900">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="mb-5 rounded-xl border border-green-700/15 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">{successMessage}</p>
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
