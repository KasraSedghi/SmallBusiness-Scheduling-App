'use client';

import React from 'react';
import { Availability, TimeOffRequest, ShiftCapacity } from '@/types/index';
import { calculateScheduleMetrics, getConstraintStatus } from '@/utils/helpers/validation';

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
        <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded">
          Under-scheduled ({metrics.shiftCount} shifts, {metrics.totalHours}h)
        </span>
      );
    } else if (!withinMaximum) {
      constraintBadge = (
        <span className="inline-block bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">
          Over-scheduled ({metrics.totalHours}h)
        </span>
      );
    }

    return (
      <div
        key={avail.id}
        className={`border border-light-cream rounded-lg p-4 mb-4 transition-colors ${
          avail.status === 'approved'
            ? 'bg-green-50 border-green-200'
            : 'bg-white hover:bg-gray-50'
        }`}
      >
        {/* Employee Header */}
        <div className="flex items-start justify-between mb-4 pb-4 border-b border-light-cream">
          <div className="flex-1">
            <h3 className="font-semibold text-red-bean">
              {avail.profile?.email || 'Unknown Employee'}
            </h3>
            <p className="text-xs text-coffee-brown opacity-70">
              ID: {avail.profile_id.substring(0, 8)}...
            </p>
          </div>
          <div className="flex items-center gap-2">
            {constraintBadge}
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                avail.status === 'approved'
                  ? 'bg-green-200 text-green-800'
                  : 'bg-yellow-200 text-yellow-800'
              }`}
            >
              {avail.status === 'approved' ? '✓ Approved' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Shift Grid */}
        <div className="overflow-x-auto mb-4">
          <div className="inline-grid gap-1 mb-4">
            {/* Day headers */}
            <div className="flex gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <div key={`header-${day}`} className="w-16 text-center">
                  <p className="text-xs font-semibold text-coffee-brown">{DAY_LABELS[day]}</p>
                </div>
              ))}
            </div>

            {/* Shift rows */}
            {SHIFT_TYPES.map((shift) => (
              <div key={`row-${shift}`} className="flex gap-1">
                {DAYS_OF_WEEK.map((day) => (
                  <div
                    key={`cell-${day}-${shift}`}
                    className="w-16 h-12 flex items-center justify-center text-xs border border-light-cream rounded"
                    title={`${DAY_LABELS[day]} ${SHIFT_LABELS[shift]}`}
                  >
                    <div
                      className={`w-full h-full flex items-center justify-center rounded transition-all ${
                        (avail.shift_data as any)[day]?.[shift]
                          ? 'bg-red-bean text-white font-bold'
                          : 'bg-white text-gray-300'
                      }`}
                    >
                      {(avail.shift_data as any)[day]?.[shift] ? '✓' : '-'}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Metrics & Action */}
        <div className="flex items-center justify-between">
          <div className="text-sm text-coffee-brown">
            <span className="font-semibold">{metrics.shiftCount} shifts</span>,{' '}
            <span className="font-semibold">{metrics.totalHours}h total</span>
          </div>
          {avail.status === 'pending' && onApprovalChange && (
            <button
              onClick={() => onApprovalChange(avail.id, 'approved')}
              className="px-4 py-2 bg-red-bean text-white-cream rounded-lg text-sm font-semibold hover:bg-dark-crimson transition-all"
            >
              Approve
            </button>
          )}
          {avail.status === 'approved' && onApprovalChange && (
            <button
              onClick={() => onApprovalChange(avail.id, 'pending')}
              className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm font-semibold hover:bg-gray-500 transition-all"
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
      <div className="bg-light-cream rounded-lg p-6 mb-8">
        <h3 className="text-lg font-semibold text-coffee-brown mb-4">Shift Staffing Summary</h3>
        <div className="space-y-3">
          {DAYS_OF_WEEK.map((day) => (
            <div key={`summary-${day}`} className="flex items-center gap-4">
              <div className="w-20 font-semibold text-red-bean">{DAY_LABELS[day]}</div>
              <div className="flex gap-4 flex-1">
                {SHIFT_TYPES.map((shift) => {
                  const required = capacityRules[day]?.[shift as any] || 0;
                  const actual = staffingByShift[day]?.[shift] || 0;
                  const shortfall = required - actual;

                  return (
                    <div
                      key={`summary-${day}-${shift}`}
                      className={`px-3 py-2 rounded text-sm font-semibold ${
                        shortfall <= 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      <span className="text-xs block opacity-75">{SHIFT_LABELS[shift]}</span>
                      {actual}/{required}
                      {shortfall > 0 && <span className="block text-xs">−{shortfall} needed</span>}
                    </div>
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
          <h2 className="text-2xl font-bold text-red-bean mb-6">
            Pending Approvals ({pendingAvailabilities.length})
          </h2>
          {pendingAvailabilities.map((avail) => renderAvailabilityRow(avail))}
        </div>
      )}

      {/* Approved Section */}
      {approvedAvailabilities.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-red-bean mb-6">
            Approved ({approvedAvailabilities.length})
          </h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            {approvedAvailabilities.map((avail) => renderAvailabilityRow(avail))}
          </div>
        </div>
      )}

      {pendingAvailabilities.length === 0 && approvedAvailabilities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-coffee-brown opacity-75">No availabilities submitted for this week</p>
        </div>
      )}
    </div>
  );
}
