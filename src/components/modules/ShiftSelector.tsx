'use client';

import React from 'react';
import { ShiftData, DayOfWeek } from '@/types';

export interface ShiftSelectorProps {
  shiftData: ShiftData;
  onShiftChange: (day: DayOfWeek, shiftType: 'morning' | 'afternoon' | 'evening', selected: boolean) => void;
  isLocked?: boolean;
}

const DAYS_OF_WEEK: Array<{ key: DayOfWeek; label: string }> = [
  { key: 'sunday', label: 'Sunday' },
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
];

const SHIFT_HOURS: Record<string, Record<string, number>> = {
  morning: { 'sun-thu': 4, 'fri-sat': 4 },
  afternoon: { 'sun-thu': 4, 'fri-sat': 4 },
  evening: { 'sun-thu': 4, 'fri-sat': 5.5 },
};

const SHIFT_TIMES: Record<string, { sunThu: string; friSat: string }> = {
  morning: { sunThu: '9:00 AM - 1:00 PM', friSat: '9:00 AM - 1:00 PM' },
  afternoon: { sunThu: '1:00 PM - 5:00 PM', friSat: '1:00 PM - 5:00 PM' },
  evening: { sunThu: '5:00 PM - 9:00 PM', friSat: '5:00 PM - 10:30 PM' },
};

export function ShiftSelector({
  shiftData,
  onShiftChange,
  isLocked = false,
}: ShiftSelectorProps) {
  const isFriSat = (day: DayOfWeek) => day === 'friday' || day === 'saturday';

  return (
    <div className="space-y-6">
      {DAYS_OF_WEEK.map((day) => {
        const dayShifts = shiftData[day.key];
        const isWeekend = isFriSat(day.key);

        return (
          <div
            key={day.key}
            className="bg-white rounded-lg border border-light-cream overflow-hidden shadow-sm"
          >
            <div className="bg-gradient-to-r from-red-bean to-dark-crimson px-4 py-3">
              <h3 className="text-lg font-semibold text-white-cream">{day.label}</h3>
            </div>

            <div className="p-4 space-y-3">
              {(['morning', 'afternoon', 'evening'] as const).map((shiftType) => {
                const shiftTime =
                  SHIFT_TIMES[shiftType][isWeekend ? 'friSat' : 'sunThu'];
                const hours =
                  SHIFT_HOURS[shiftType][
                    isWeekend ? 'fri-sat' : 'sun-thu'
                  ];
                const isSelected = dayShifts[shiftType];

                return (
                  <label
                    key={shiftType}
                    className="flex items-center gap-3 cursor-pointer p-3 rounded-lg hover:bg-light-cream transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        !isLocked && onShiftChange(day.key, shiftType, e.target.checked)
                      }
                      disabled={isLocked}
                      className="w-6 h-6 rounded cursor-pointer accent-red-bean"
                      aria-label={`${day.label} ${shiftType} shift`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-coffee-brown">
                        {shiftType.charAt(0).toUpperCase() + shiftType.slice(1)}
                      </div>
                      <div className="text-xs text-coffee-brown opacity-70">
                        {shiftTime} ({hours}h)
                      </div>
                    </div>
                    {isSelected && !isLocked && (
                      <div className="w-5 h-5 rounded-full bg-red-bean flex items-center justify-center">
                        <svg
                          className="w-3 h-3 text-white-cream"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
