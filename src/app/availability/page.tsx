'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShiftSelector } from '@/components/modules/ShiftSelector';
import AvatarUploader from '@/components/modules/AvatarUploader';
import { getCurrentUser } from '@/utils/supabase/auth';
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
        // Get current user
        const userResult = await getCurrentUser();
        if (userResult.error || !userResult.data) {
          router.push('/login');
          return;
        }

        setUserEmail(userResult.data.email || null);
        setUserId(userResult.data.id);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-light-cream border-t-red-bean rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-coffee-brown">Loading your availability...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-red-bean mb-2">
                Your Weekly Shifts
              </h1>
              <p className="text-coffee-brown">
                Week of {new Date(weekStarting).toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </p>
              {userEmail && (
                <p className="text-sm text-coffee-brown opacity-70 mt-1">{userEmail}</p>
              )}
            </div>
            {userId && userEmail && (
              <div className="bg-white rounded-lg p-4 border border-light-cream">
                <AvatarUploader
                  profileId={userId}
                  email={userEmail}
                />
              </div>
            )}
          </div>
        </div>

        {/* Deadline Notice */}
        {isDeadlinePassed ? (
          <div className="mb-6 p-4 bg-red-100 border-l-4 border-red-bean rounded-r-lg">
            <div className="flex items-start gap-3">
              <div className="text-red-bean text-lg mt-0.5">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-bean mb-1">
                  Submission Deadline Passed
                </h3>
                <p className="text-sm text-coffee-brown">
                  The deadline for submitting your availability was Sunday at 10:00 AM.
                  Your shifts are now locked. Contact an admin if you need to make changes.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-light-cream border-l-4 border-red-bean rounded-r-lg">
            <div className="flex items-start gap-3">
              <div className="text-red-bean text-lg mt-0.5">⏱️</div>
              <div>
                <h3 className="font-semibold text-coffee-brown mb-1">
                  Submit by Sunday 10:00 AM
                </h3>
                <p className="text-sm text-coffee-brown">
                  {hoursUntilDeadline > 0
                    ? `${hoursUntilDeadline} hours remaining to submit your availability`
                    : 'Deadline approaching!'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Requirements & Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-white rounded-lg p-4 text-center border border-light-cream">
            <div className="text-2xl font-bold text-red-bean">{totalShifts}</div>
            <div className="text-xs text-coffee-brown mt-1">Shifts Selected</div>
            <div className="text-xs text-coffee-brown opacity-70 mt-1">Min: 2</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-light-cream">
            <div className="text-2xl font-bold text-red-bean">{totalHours.toFixed(1)}</div>
            <div className="text-xs text-coffee-brown mt-1">Hours</div>
            <div className="text-xs text-coffee-brown opacity-70 mt-1">Min: 8</div>
          </div>
          <div className="bg-white rounded-lg p-4 text-center border border-light-cream">
            <div
              className={`text-2xl font-bold ${
                validation.isValid ? 'text-red-bean' : 'text-red-600'
              }`}
            >
              {validation.isValid ? '✓' : '✕'}
            </div>
            <div className="text-xs text-coffee-brown mt-1">Status</div>
            <div className="text-xs text-coffee-brown opacity-70 mt-1">
              {validation.isValid ? 'Valid' : 'Invalid'}
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-bean rounded-r-lg">
            <p className="text-sm font-semibold text-red-bean">{error}</p>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-600 rounded-r-lg">
            <p className="text-sm font-semibold text-green-700">{successMessage}</p>
          </div>
        )}

        {/* Shift Selector */}
        <div className="mb-8">
          <ShiftSelector
            shiftData={shiftData}
            onShiftChange={handleShiftChange}
            isLocked={isDeadlinePassed}
          />
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isDeadlinePassed || saving || !validation.isValid}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              isDeadlinePassed || saving || !validation.isValid
                ? 'bg-light-cream text-coffee-brown opacity-50 cursor-not-allowed'
                : 'bg-red-bean text-white-cream hover:bg-dark-crimson active:scale-95'
            }`}
          >
            {saving ? 'Saving...' : 'Save Availability'}
          </button>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-3 rounded-lg font-semibold border border-coffee-brown text-coffee-brown hover:bg-light-cream transition-all"
          >
            Back
          </button>
        </div>

        {/* Minimum Requirements Info */}
        <div className="mt-8 p-4 bg-light-cream rounded-lg text-sm text-coffee-brown">
          <h3 className="font-semibold mb-2">Minimum Requirements</h3>
          <ul className="space-y-1 opacity-70">
            <li>• At least 2 shifts per week</li>
            <li>• At least 8 hours total per week</li>
            <li>• Maximum 40 hours per week</li>
            <li>• Each shift is at least 3 hours</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
