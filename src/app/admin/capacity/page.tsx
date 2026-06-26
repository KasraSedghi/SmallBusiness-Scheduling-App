'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/utils/supabase/auth';
import { getWeekStartingDate } from '@/utils/shift-helpers';

interface CapacityRules {
  capacity: Record<string, Record<string, number>>;
  is_holiday?: boolean;
  backup_capacity?: Record<string, Record<string, number>>;
  holiday_overrides?: Record<string, number>;
}

interface CapacitySettings {
  id?: string;
  week_starting: string;
  rules: CapacityRules;
}

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SHIFT_TYPES = ['morning', 'afternoon', 'evening'];
const SHIFT_LABELS = { morning: '9AM-1PM', afternoon: '1PM-5PM', evening: '5PM-9PM/10:30PM' };
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

const DEFAULT_CAPACITIES = {
  monday: { morning: 4, afternoon: 4, evening: 4 },
  tuesday: { morning: 4, afternoon: 4, evening: 4 },
  wednesday: { morning: 4, afternoon: 4, evening: 4 },
  thursday: { morning: 4, afternoon: 4, evening: 4 },
  friday: { morning: 6, afternoon: 6, evening: 4 },
  saturday: { morning: 6, afternoon: 6, evening: 4 },
  sunday: { morning: 6, afternoon: 6, evening: 4 },
};

export default function AdminCapacityPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [weekStarting, setWeekStarting] = useState(getWeekStartingDate());
  const [capacities, setCapacities] = useState<Record<string, Record<string, number>>>(
    JSON.parse(JSON.stringify(DEFAULT_CAPACITIES))
  );
  const [isHoliday, setIsHoliday] = useState(false);
  const [backupCapacities, setBackupCapacities] = useState<Record<string, Record<string, number>> | null>(
    null
  );
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const userResult = await getCurrentUser();
        if (userResult.error || !userResult.data || userResult.data.role !== 'admin') {
          router.push('/login');
          return;
        }

        const response = await fetch(
          `/api/admin/capacity?week_starting=${weekStarting}`
        );
        if (!response.ok) throw new Error('Failed to fetch capacity settings');

        const { data } = await response.json();
        setSettingsId(data.id || null);
        setCapacities(data.rules.capacity || DEFAULT_CAPACITIES);
        setIsHoliday(data.rules.is_holiday || false);
        setBackupCapacities(data.rules.backup_capacity || null);
      } catch (err) {
        console.error('Failed to load capacity settings:', err);
        setError('Failed to load capacity settings');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [weekStarting, router]);

  const updateCapacity = useCallback(
    (day: string, shiftType: string, value: number) => {
      setCapacities((prev) => ({
        ...prev,
        [day]: {
          ...prev[day],
          [shiftType]: Math.max(0, value),
        },
      }));
      if (error) setError(null);
      if (successMessage) setSuccessMessage(null);
    },
    [error, successMessage]
  );

  const toggleHoliday = useCallback(async () => {
    if (isHoliday && backupCapacities) {
      setCapacities(JSON.parse(JSON.stringify(backupCapacities)));
      setBackupCapacities(null);
    } else if (!isHoliday) {
      setBackupCapacities(JSON.parse(JSON.stringify(capacities)));
      const holidayCapacities: Record<string, Record<string, number>> = {};
      DAYS_OF_WEEK.forEach((day) => {
        holidayCapacities[day] = {
          morning: 6,
          afternoon: 6,
          evening: 6,
        };
      });
      setCapacities(holidayCapacities);
    }
    setIsHoliday(!isHoliday);
  }, [isHoliday, capacities, backupCapacities]);

  const handleSave = async () => {
    if (saving) return;

    setSaving(true);
    setError(null);

    try {
      const rules: CapacityRules = {
        capacity: capacities,
        is_holiday: isHoliday,
        holiday_overrides: {},
      };

      if (isHoliday && backupCapacities) {
        rules.backup_capacity = backupCapacities;
      }

      const method = settingsId ? 'PUT' : 'POST';
      const body: any = {
        week_starting: weekStarting,
        rules,
      };

      if (settingsId) {
        body.id = settingsId;
      }

      const response = await fetch('/api/admin/capacity', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Failed to save capacity settings');

      const { data } = await response.json();
      setSettingsId(data.id);
      setSuccessMessage('Capacity settings saved successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Failed to save capacity settings:', err);
      setError('Failed to save capacity settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    setCapacities(JSON.parse(JSON.stringify(DEFAULT_CAPACITIES)));
    setIsHoliday(false);
    setBackupCapacities(null);
    setError(null);
    setSuccessMessage(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-border border-t-brand rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-ink-soft">Loading capacity settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors hover:text-brand"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
          <h1 className="mb-2 inline-block bg-linear-to-r from-brand via-shift-evening to-shift-morning bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
            Staffing Capacity Settings
          </h1>
          <p className="text-ink-soft">
            Week of {new Date(weekStarting).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
          </p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-brand-deep/5 border-l-4 border-brand rounded-r-lg">
            <p className="text-sm font-semibold text-brand">{error}</p>
          </div>
        )}

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 p-4 bg-success/5 border-l-4 border-success rounded-r-lg">
            <p className="text-sm font-semibold text-success">{successMessage}</p>
          </div>
        )}

        {/* Holiday Override Toggle */}
        <div className="panel mb-8 rounded-lg p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-brand mb-1">Holiday Override</h2>
              <p className="text-sm text-ink-soft opacity-75">
                {isHoliday
                  ? 'All shifts set to 6 staff. Custom values are saved and will be restored when disabled.'
                  : 'Enable to set all shifts to 6 staff for holiday weeks.'}
              </p>
            </div>
            <button
              onClick={toggleHoliday}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isHoliday ? 'bg-brand' : 'bg-surface-muted'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-cream-white transition-transform ${
                  isHoliday ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Capacity Settings Grid */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="panel rounded-lg p-6">
              <h3 className="text-lg font-semibold text-brand mb-4">{DAY_LABELS[day]}</h3>

              <div className="grid grid-cols-3 gap-4">
                {SHIFT_TYPES.map((shiftType) => (
                  <div key={`${day}-${shiftType}`}>
                    <label className="block text-xs font-medium text-ink-soft mb-2 uppercase">
                      {(SHIFT_LABELS as any)[shiftType]}
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={capacities[day]?.[shiftType] ?? 0}
                      onChange={(e) =>
                        updateCapacity(day, shiftType, parseInt(e.target.value, 10) || 0)
                      }
                      disabled={isHoliday}
                      className={`w-full px-3 py-3 border border-border rounded-lg text-center font-semibold text-lg transition-colors ${
                        isHoliday
                          ? 'bg-surface-muted text-ink-faint cursor-not-allowed'
                          : 'bg-surface-muted text-brand focus:outline-none focus:border-brand'
                      }`}
                    />
                  </div>
                ))}
              </div>

              {isHoliday && (
                <div className="mt-4 p-3 bg-shift-afternoon-soft border border-shift-afternoon/30 rounded-lg">
                  <p className="text-xs text-shift-afternoon">
                    Holiday override active. Saved custom values will be restored when disabled.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Summary Card */}
        <div className="bg-surface-muted rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-ink-soft mb-4">Summary</h3>
          <div className="space-y-2 text-sm text-ink-soft">
            <p>
              <span className="font-semibold">Total shifts configured:</span>{' '}
              {DAYS_OF_WEEK.length * SHIFT_TYPES.length}
            </p>
            <p>
              <span className="font-semibold">Holiday mode:</span> {isHoliday ? 'Enabled (All shifts = 6)' : 'Disabled'}
            </p>
            <p>
              <span className="font-semibold">Custom values backed up:</span>{' '}
              {backupCapacities ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
              saving
                ? 'bg-surface-muted text-ink-soft opacity-50 cursor-not-allowed'
                : 'bg-brand text-cream-white hover:bg-brand-deep active:scale-95'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <button
            onClick={handleResetToDefaults}
            className="px-4 py-3 rounded-lg font-semibold border border-ink-soft text-ink-soft hover:bg-surface-muted transition-all"
          >
            Reset to Defaults
          </button>

          <button
            onClick={() => router.push('/')}
            className="px-4 py-3 rounded-lg font-semibold border border-ink-soft text-ink-soft hover:bg-surface-muted transition-all"
          >
            Back
          </button>
        </div>

        {/* Info Section */}
        <div className="p-4 bg-surface-muted rounded-lg text-sm text-ink-soft">
          <h3 className="font-semibold mb-2">Default Configuration</h3>
          <ul className="space-y-1 opacity-70">
            <li>• Weekdays (Mon-Thu): 4 staff per shift</li>
            <li>• Friday & Saturday mornings & afternoons: 6 staff</li>
            <li>• Friday & Saturday evenings: 4 staff</li>
            <li>• Sundays mornings & afternoons: 6 staff</li>
            <li>• Sundays evenings: 4 staff</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
