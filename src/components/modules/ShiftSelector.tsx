'use client';

import React from 'react';
import { ShiftData, DayOfWeek } from '@/types';

export interface ShiftSelectorProps {
  shiftData: ShiftData;
  onShiftChange: (day: DayOfWeek, shiftType: 'morning' | 'afternoon' | 'evening', selected: boolean) => void;
  isLocked?: boolean;
}

const DAYS_OF_WEEK: Array<{ key: DayOfWeek; label: string; short: string }> = [
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
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
    <div className="space-y-5">
      {DAYS_OF_WEEK.map((day) => {
        const dayShifts = shiftData[day.key];
        const isWeekend = isFriSat(day.key);

        return (
          <section key={day.key}>
            <h3 className="mb-2 px-1 text-sm font-semibold text-ink-soft">
              {day.label}
            </h3>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {(['morning', 'afternoon', 'evening'] as const).map((shiftType) => {
                const shiftTime = SHIFT_TIMES[shiftType][isWeekend ? 'friSat' : 'sunThu'];
                const hours = SHIFT_HOURS[shiftType][isWeekend ? 'fri-sat' : 'sun-thu'];
                const isSelected = dayShifts[shiftType];

                return (
                  <button
                    key={shiftType}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    aria-label={`${day.label} ${shiftType} shift`}
                    disabled={isLocked}
                    onClick={() => !isLocked && onShiftChange(day.key, shiftType, !isSelected)}
                    className={`min-h-11 select-none rounded-xl p-4 text-left transition-all duration-200 ${
                      isLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer active:scale-95 active:duration-150'
                    } ${
                      isSelected
                        ? 'border-2 border-brand bg-brand-deep/5 font-medium text-brand-deep shadow-sm'
                        : 'border border-border bg-white/90 text-ink-soft hover:border-border-strong'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-medium">
                          {shiftType.charAt(0).toUpperCase() + shiftType.slice(1)}
                        </div>
                        <div className={`mt-0.5 text-xs ${isSelected ? 'text-brand/70' : 'text-ink-faint'}`}>
                          {shiftTime}
                        </div>
                        <div className={`text-xs ${isSelected ? 'text-brand/70' : 'text-ink-faint'}`}>
                          {hours}h
                        </div>
                      </div>
                      {isSelected && (
                        <svg
                          className="mt-0.5 h-4 w-4 shrink-0 text-brand"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
