'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShiftSelector } from '@/components/modules/ShiftSelector';
import AvatarUploader from '@/components/modules/AvatarUploader';
import { getCurrentUser, signOut } from '@/utils/supabase/auth';
import { createClient } from '@/utils/supabase/client';
import {
  calculateTotalHours,
  calculateTotalShifts,
  isSubmissionDeadlinePassedForWeek,
  getWeekStartingDate,
  getHoursUntilDeadline,
} from '@/utils/shift-helpers';
import { validateSchedule } from '@/utils/validation';
import { ShiftData, emptyShiftData, DayOfWeek } from '@/types';

export default function AvailabilityPage() {
  const router = useRouter();
  const [shiftData, setShiftData] = useState<ShiftData>(emptyShiftData());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isDeadlinePassed, setIsDeadlinePassed] = useState(false);
  const [hoursUntilDeadline, setHoursUntilDeadline] = useState(0);

  const weekStarting = getWeekStartingDate();
  const totalHours = calculateTotalHours(shiftData);
  const totalShifts = calculateTotalShifts(shiftData);

  const validation = validateSchedule(
    Array(totalShifts).fill({ hours: totalHours / Math.max(totalShifts, 1) }),
    totalHours
  );

  // Load user and existing availability
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check for authorization error from middleware
        const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
        if (params.get('error') === 'unauthorized') {
          setError('Access denied. You do not have permission to access the admin dashboard.');
          setLoading(false);
          return;
        }

        // Get current user
        const userResult = await getCurrentUser();
        if (userResult.error || !userResult.data) {
          router.push('/login');
          return;
        }

        setUserEmail(userResult.data.email || null);
        setUserId(userResult.data.id);

        // Load avatar for the sticky header
        const supabaseProfile = createClient();
        const { data: profile } = await supabaseProfile
          .from('profiles')
          .select('avatar_url')
          .eq('id', userResult.data.id)
          .single();
        if (profile) {
          setAvatarUrl((profile as any).avatar_url || null);
        }

        // Check deadline
        const deadlinePassed = isSubmissionDeadlinePassedForWeek(weekStarting);
        setIsDeadlinePassed(deadlinePassed);
        setHoursUntilDeadline(getHoursUntilDeadline(weekStarting));

        // Load existing availability
        const supabase = createClient();
        const { data: availability, error: dbError } = await supabase
          .from('availabilities')
          .select('shift_data')
          .eq('profile_id', userResult.data.id)
          .eq('week_starting', weekStarting)
          .single();

        if (!dbError && availability) {
          setShiftData((availability as any).shift_data as ShiftData);
        }
      } catch (err) {
        console.error('Failed to load availability:', err);
        setError('Failed to load your availability data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [weekStarting, router]);

  const handleShiftChange = useCallback(
    (day: DayOfWeek, shiftType: 'morning' | 'afternoon' | 'evening', selected: boolean) => {
      if (isDeadlinePassed) return;

      setShiftData((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [shiftType]: selected,
        },
      }));

      if (error) setError(null);
      if (successMessage) setSuccessMessage(null);
    },
    [isDeadlinePassed, error, successMessage]
  );

  const handleSave = async () => {
    if (isDeadlinePassed || saving) return;

    // Validate
    if (!validation.isValid) {
      setError(validation.errors.join('; '));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const userResult = await getCurrentUser();
      if (!userResult.data) {
        setError('Session expired. Please log in again.');
        router.push('/login');
        return;
      }

      const supabase = createClient();

      // Check if availability already exists
      const { data: existing } = await supabase
        .from('availabilities')
        .select('id')
        .eq('profile_id', userResult.data.id)
        .eq('week_starting', weekStarting)
        .single();

      const supabaseTable = supabase.from('availabilities') as any;

      if (existing) {
        // Update existing
        const updateData: any = {
          shift_data: shiftData,
          updated_at: new Date().toISOString(),
        };
        const { error: updateError } = await supabaseTable
          .update(updateData)
          .eq('id', (existing as any).id);

        if (updateError) throw updateError;
      } else {
        // Insert new
        const insertData: any = {
          profile_id: userResult.data.id,
          week_starting: weekStarting,
          shift_data: shiftData,
          status: 'pending',
        };
        const { error: insertError } = await supabaseTable.insert(insertData);

        if (insertError) throw insertError;
      }

      setSuccessMessage('Your availability has been saved successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save availability:', err);
      setError('Failed to save your availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const initials = userEmail
    ? userEmail
        .split('@')[0]
        .split(/[._-]/)
        .slice(0, 2)
        .map((p) => p.charAt(0).toUpperCase())
        .join('')
    : '';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface p-4">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-border border-t-brand"></div>
          <p className="text-ink-soft">Loading your availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* Sticky header: employee profile section */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={userEmail || 'Profile'}
                className="h-10 w-10 shrink-0 rounded-full border border-orange-200/60 object-cover shadow-inner"
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-200/60 bg-orange-100 text-sm font-semibold text-brand-deep shadow-inner">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink">
                {userEmail || 'Employee'}
              </p>
              <p className="truncate text-xs text-ink-muted">
                Week of{' '}
                {new Date(weekStarting).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            className="shrink-0 rounded-lg px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink-soft"
          >
            Sign Out
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        <h1 className="mb-4 inline-block bg-linear-to-r from-shift-morning via-brand to-shift-evening bg-clip-text text-2xl font-bold text-transparent">
          Your Weekly Shifts
        </h1>

        {/* Deadline Notice */}
        {isDeadlinePassed ? (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-brand/15 bg-brand-deep/5 p-4">
            <span className="mt-0.5 text-lg">⚠️</span>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-brand-deep">
                Submission Deadline Passed
              </h3>
              <p className="text-sm font-light text-brand/80">
                The deadline for submitting your availability was Sunday at 10:00 AM.
                Your shifts are now locked. Contact an admin if you need to make changes.
              </p>
            </div>
          </div>
        ) : (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/5 p-4">
            <span className="mt-0.5 text-lg">⏱️</span>
            <div>
              <h3 className="mb-1 text-sm font-semibold text-warning">
                Submit by Sunday 10:00 AM
              </h3>
              <p className="text-sm font-light text-warning">
                {hoursUntilDeadline > 0
                  ? `${hoursUntilDeadline} hours remaining to submit your availability`
                  : 'Deadline approaching!'}
              </p>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-5 rounded-xl border border-brand/15 bg-brand-deep/5 p-4">
            <p className="text-sm font-medium text-brand">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-5 rounded-xl border border-success/15 bg-success/5 p-4">
            <p className="text-sm font-medium text-success">{successMessage}</p>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          {/* Left: Requirements */}
          <div className="rounded-2xl border border-border bg-white/90 p-6">
            <h2 className="mb-5 text-xl font-bold text-ink">Weekly Requirements</h2>

            <div className="space-y-4">
              <div
                className={`flex items-center gap-4 rounded-xl p-4 ${
                  totalShifts >= 2 ? 'bg-success/10' : 'bg-surface-muted'
                }`}
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                    totalShifts >= 2 ? 'bg-success/15 text-success' : 'bg-white text-ink-faint'
                  }`}
                >
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-muted">Shifts Selected</p>
                  <p className={`text-4xl font-extrabold leading-none ${totalShifts >= 2 ? 'text-success' : 'text-ink'}`}>
                    {totalShifts}
                    <span className="text-base font-medium text-ink-faint"> / 2 min</span>
                  </p>
                </div>
                {totalShifts >= 2 && <span className="text-3xl text-success">✓</span>}
              </div>

              <div
                className={`flex items-center gap-4 rounded-xl p-4 ${
                  totalHours >= 8 ? 'bg-success/10' : 'bg-surface-muted'
                }`}
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                    totalHours >= 8 ? 'bg-success/15 text-success' : 'bg-white text-ink-faint'
                  }`}
                >
                  <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-muted">Hours</p>
                  <p className={`text-4xl font-extrabold leading-none ${totalHours >= 8 ? 'text-success' : 'text-ink'}`}>
                    {totalHours.toFixed(1)}
                    <span className="text-base font-medium text-ink-faint"> / 8 min</span>
                  </p>
                </div>
                {totalHours >= 8 && <span className="text-3xl text-success">✓</span>}
              </div>

              <div
                className={`flex items-center gap-4 rounded-xl p-4 ${
                  validation.isValid ? 'bg-success/10' : 'bg-danger/10'
                }`}
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-2xl font-bold ${
                    validation.isValid ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'
                  }`}
                >
                  {validation.isValid ? '✓' : '✕'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-ink-muted">Status</p>
                  <p className={`text-2xl font-extrabold leading-none ${validation.isValid ? 'text-success' : 'text-danger'}`}>
                    {validation.isValid ? 'Valid' : 'Invalid'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 border-t border-border pt-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-ink-muted">
                The Rules
              </h3>
              <ul className="space-y-3">
                {[
                  'At least 2 shifts per week',
                  'At least 8 hours total per week',
                  'Maximum 40 hours per week',
                  'Each shift is at least 3 hours',
                ].map((rule) => (
                  <li key={rule} className="flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                      ✓
                    </span>
                    <span className="text-base font-medium text-ink-soft">{rule}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right: Scheduling */}
          <div className="rounded-2xl border border-border bg-white/90 p-6">
            <h2 className="mb-5 text-xl font-bold text-ink">Pick Your Shifts</h2>

            <div className="mb-6">
              <ShiftSelector
                shiftData={shiftData}
                onShiftChange={handleShiftChange}
                isLocked={isDeadlinePassed}
              />
            </div>

            <button
              onClick={handleSave}
              disabled={isDeadlinePassed || saving || !validation.isValid}
              className={`w-full transform rounded-xl py-3 font-medium transition-all duration-300 ${
                isDeadlinePassed || saving || !validation.isValid
                  ? 'cursor-not-allowed bg-border text-ink-faint'
                  : 'bg-linear-to-r from-brand-deep to-brand text-cream-white shadow-md shadow-brand-deep/10 hover:-translate-y-0.5 hover:from-brand hover:to-rose-900 active:scale-[0.98]'
              }`}
            >
              {saving ? 'Saving...' : 'Save Availability'}
            </button>
          </div>
        </div>

        {/* Avatar settings */}
        {userId && userEmail && (
          <div className="mt-6 rounded-xl border border-border bg-white/90 p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink-soft">Profile Picture</h3>
            <AvatarUploader
              profileId={userId}
              email={userEmail}
              currentAvatarUrl={avatarUrl}
              onUploadSuccess={(url) => setAvatarUrl(url)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
