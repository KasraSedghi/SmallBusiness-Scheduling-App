'use client';

import React from 'react';
import { Availability, TimeOffRequest, ShiftCapacity } from '@/types/index';
import { calculateScheduleMetrics, getConstraintStatus } from '@/utils/helpers/validation';
import AvatarDisplay from '@/components/ui/AvatarDisplay';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SHIFT_TYPES = ['morning', 'afternoon', 'evening'];
const SHIFT_LABELS: Record<string, string> = {
  morning: '9AM-1PM',
  afternoon: '1PM-5PM',
  evening: '5PM-9:30PM',
};
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
};

interface RosterGridProps {
  availabilities: (Availability & { profile?: any })[];
  capacityRules: Record<string, ShiftCapacity>;
  timeOffRequests: TimeOffRequest[];
  weekStarting: string;
  onApprovalChange?: (availabilityId: string, newStatus: string) => void;
}

export default function RosterGrid({
  availabilities,
  capacityRules,
  timeOffRequests,
  weekStarting,
  onApprovalChange,
}: RosterGridProps) {
  // Calculate staffing levels per shift
  const staffingByShift: Record<string, Record<string, number>> = {};
  DAYS_OF_WEEK.forEach((day) => {
    staffingByShift[day] = {};
    SHIFT_TYPES.forEach((shift) => {
      staffingByShift[day][shift] = 0;
    });
  });

  availabilities.forEach((avail) => {
    if (avail.status === 'approved') {
      DAYS_OF_WEEK.forEach((day) => {
        SHIFT_TYPES.forEach((shift) => {
          if ((avail.shift_data as any)[day]?.[shift]) {
            staffingByShift[day][shift]++;
          }
        });
      });
    }
  });

  // Group availabilities by approval status
  const pendingAvailabilities = availabilities.filter((a) => a.status === 'pending');
  const approvedAvailabilities = availabilities.filter((a) => a.status === 'approved');

  const renderAvailabilityRow = (avail: any) => {
    const metrics = calculateScheduleMetrics(avail.shift_data);
    const constraintStatus = getConstraintStatus(avail.shift_data);

    const meetsMinimum = metrics.shiftCount >= 2 && metrics.totalHours >= 8;
    const withinMaximum = metrics.totalHours <= 40;
    const isCompliant = meetsMinimum && withinMaximum;

    // Determine constraint badge
    let constraintBadge = null;
    if (!meetsMinimum) {
      constraintBadge = (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-900">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400 duration-2000" />
          Under-scheduled ({metrics.shiftCount} shifts, {metrics.totalHours}h)
        </span>
      );
    } else if (!withinMaximum) {
      constraintBadge = (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-900">
          Over-scheduled ({metrics.totalHours}h)
        </span>
      );
    }

    return (
      <div
        key={avail.id}
        className="overflow-hidden rounded-xl border border-stone-200/60 bg-white transition-colors duration-150 hover:bg-orange-50/40"
      >
        {/* Employee Header */}
        <div className="flex items-start justify-between gap-3 border-b border-stone-200/60 p-4">
          <div className="flex flex-1 items-start gap-3">
            <AvatarDisplay
              email={avail.profile?.email || 'Unknown Employee'}
              avatarUrl={avail.profile?.avatar_url}
              size="md"
            />
            <div>
              <h3 className="font-semibold text-stone-800">
                {avail.profile?.email || 'Unknown Employee'}
              </h3>
              <p className="text-xs text-stone-400">
                ID: {avail.profile_id.substring(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {constraintBadge}
            <span
              className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                avail.status === 'approved'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-amber-100 text-amber-900'
              }`}
            >
              {avail.status === 'approved' ? '✓ Approved' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Shift Grid */}
        <div className="overflow-x-auto p-4">
          <div className="inline-grid gap-px overflow-hidden rounded-lg border border-stone-200/60 bg-stone-200/60">
            {/* Day headers */}
            <div className="flex gap-px">
              {DAYS_OF_WEEK.map((day) => (
                <div
                  key={`header-${day}`}
                  className="w-16 bg-stone-100/80 p-2 text-center text-xs font-semibold uppercase tracking-wider text-stone-700"
                >
                  {DAY_LABELS[day]}
                </div>
              ))}
            </div>

            {/* Shift rows */}
            {SHIFT_TYPES.map((shift) => (
              <div key={`row-${shift}`} className="flex gap-px">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={`cell-${day}-${shift}`}
                    className="flex h-12 w-16 items-center justify-center bg-white text-xs"
                    title={`${DAY_LABELS[day]} ${SHIFT_LABELS[shift]}`}
                  >
                    <div
                      className={`flex h-full w-full items-center justify-center font-semibold transition-all ${
                        (avail.shift_data as any)[day]?.[shift]
                          ? 'bg-red-950/5 text-red-900'
                          : 'text-stone-300'
                      }`}
                    >
                      {(avail.shift_data as any)[day]?.[shift] ? '✓' : '–'}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics & Action */}
        <div className="flex items-center justify-between border-t border-stone-200/60 p-4">
          <div className="text-sm text-stone-500">
            <span className="font-semibold text-stone-700">{metrics.shiftCount} shifts</span>,{' '}
            <span className="font-semibold text-stone-700">{metrics.totalHours}h total</span>
          </div>
          {avail.status === 'pending' && onApprovalChange && (
            <button
              onClick={() => onApprovalChange(avail.id, 'approved')}
              className="rounded-lg bg-linear-to-r from-red-950 to-red-900 px-4 py-2 text-sm font-medium text-stone-100 shadow-md shadow-red-950/10 transition-all duration-200 hover:from-red-900 active:scale-[0.98]"
            >
              Approve
            </button>
          )}
          {avail.status === 'approved' && onApprovalChange && (
            <button
              onClick={() => onApprovalChange(avail.id, 'pending')}
              className="rounded-lg border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition-all duration-200 hover:bg-stone-50 active:scale-[0.98]"
            >
              Revert
            </button>
          )}
        </div>
      </div>
    );
  };

  // Calculate shift staffing summary
  const renderStaffingSummary = () => {
    return (
      <div className="overflow-hidden rounded-xl border border-stone-200/60 bg-white">
        <div className="border-b border-stone-200/60 bg-stone-100/80 p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-700">
            Shift Staffing Summary
          </h3>
        </div>
        <div className="divide-y divide-stone-200/60">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={`summary-${day}`}
              className="flex items-center gap-4 p-4 transition-colors duration-150 hover:bg-orange-50/40"
            >
              <div className="w-20 text-sm font-semibold text-stone-700">{DAY_LABELS[day]}</div>
              <div className="flex flex-1 gap-3">
                {SHIFT_TYPES.map((shift) => {
                  const required = (capacityRules[day] as any)?.[shift] || 0;
                  const actual = staffingByShift[day]?.[shift] || 0;
                  const shortfall = required - actual;

                  return shortfall > 0 ? (
                    <span
                      key={`summary-${day}-${shift}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-900"
                    >
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-rose-400 duration-2000" />
                      {SHIFT_LABELS[shift]} {actual}/{required}
                    </span>
                  ) : (
                    <span
                      key={`summary-${day}-${shift}`}
                      className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-medium text-stone-600"
                    >
                      {SHIFT_LABELS[shift]} {actual}/{required}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Staffing Summary */}
      {renderStaffingSummary()}

      {/* Pending Approvals Section */}
      {pendingAvailabilities.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-700">
            Pending Approvals ({pendingAvailabilities.length})
          </h2>
          <div className="space-y-3">
            {pendingAvailabilities.map((avail) => renderAvailabilityRow(avail))}
          </div>
        </div>
      )}

      {/* Approved Section */}
      {approvedAvailabilities.length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-700">
            Approved ({approvedAvailabilities.length})
          </h2>
          <div className="space-y-3">
            {approvedAvailabilities.map((avail) => renderAvailabilityRow(avail))}
          </div>
        </div>
      )}

      {pendingAvailabilities.length === 0 && approvedAvailabilities.length === 0 && (
        <div className="rounded-xl border border-stone-200/60 bg-white py-12 text-center">
          <p className="text-stone-500">No availabilities submitted for this week</p>
        </div>
      )}
    </div>
  );
}
