'use client';

import React from 'react';
import { Availability, ShiftCapacity } from '@/types/index';
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

// Colour-code every chip/indicator by shift type. Full static class strings
// so Tailwind's JIT scanner picks them up.
const SHIFT_CHIP_CLASSES: Record<string, string> = {
  morning: 'bg-shift-morning text-cream-white',
  afternoon: 'bg-shift-afternoon text-cream-white',
  evening: 'bg-shift-evening text-cream-white',
};
const SHIFT_CHIP_GHOST_CLASSES: Record<string, string> = {
  morning: 'border border-shift-morning text-shift-morning bg-transparent',
  afternoon: 'border border-shift-afternoon text-shift-afternoon bg-transparent',
  evening: 'border border-shift-evening text-shift-evening bg-transparent',
};
const SHIFT_DOT_CLASSES: Record<string, string> = {
  morning: 'bg-shift-morning',
  afternoon: 'bg-shift-afternoon',
  evening: 'bg-shift-evening',
};
const SHIFT_INDICATOR_SOFT_CLASSES: Record<string, string> = {
  morning: 'bg-shift-morning-soft text-shift-morning border border-shift-morning/30',
  afternoon: 'bg-shift-afternoon-soft text-shift-afternoon border border-shift-afternoon/30',
  evening: 'bg-shift-evening-soft text-shift-evening border border-shift-evening/30',
};

interface RosterGridProps {
  availabilities: (Availability & { profile?: any })[];
  capacityRules: Record<string, ShiftCapacity>;
  weekStarting: string;
}

export default function RosterGrid({ availabilities, capacityRules }: RosterGridProps) {
  // One row per employee who has submitted anything this week.
  const employeesById = new Map<string, { id: string; email: string; avatarUrl?: string | null }>();
  availabilities.forEach((avail) => {
    if (!employeesById.has(avail.profile_id)) {
      employeesById.set(avail.profile_id, {
        id: avail.profile_id,
        email: avail.profile?.email || 'Unknown Employee',
        avatarUrl: avail.profile?.avatar_url,
      });
    }
  });
  const employees = Array.from(employeesById.values()).sort((a, b) => a.email.localeCompare(b.email));

  // staffingByShift[day][shift] -> { actual, required, people: [{ email, status }] }
  const staffingByShift: Record<
    string,
    Record<string, { actual: number; required: number; people: { email: string; status: string }[] }>
  > = {};
  DAYS_OF_WEEK.forEach((day) => {
    staffingByShift[day] = {};
    SHIFT_TYPES.forEach((shift) => {
      staffingByShift[day][shift] = {
        actual: 0,
        required: (capacityRules[day] as any)?.[shift] || 0,
        people: [],
      };
    });
  });

  availabilities.forEach((avail) => {
    DAYS_OF_WEEK.forEach((day) => {
      SHIFT_TYPES.forEach((shift) => {
        if ((avail.shift_data as any)[day]?.[shift]) {
          const slot = staffingByShift[day][shift];
          slot.people.push({ email: avail.profile?.email || 'Unknown Employee', status: avail.status });
          if (avail.status === 'approved') slot.actual++;
        }
      });
    });
  });

  // For the per-employee × day cells: which shifts (and what status) this
  // employee has on a given day.
  const cellShifts = (profileId: string, day: string) => {
    const avail = availabilities.find((a) => a.profile_id === profileId);
    if (!avail) return [];
    return SHIFT_TYPES.filter((shift) => (avail.shift_data as any)[day]?.[shift]).map((shift) => ({
      shift,
      status: avail.status,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Shift colour legend */}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Shifts</span>
        {SHIFT_TYPES.map((shift) => (
          <span key={`legend-${shift}`} className="flex items-center gap-2 text-xs font-medium text-ink-soft">
            <span className={`h-3 w-3 rounded-full ${SHIFT_DOT_CLASSES[shift]}`} />
            <span className="capitalize">{shift}</span>
            <span className="text-ink-faint">{SHIFT_LABELS[shift]}</span>
          </span>
        ))}
        <span className="ml-2 flex items-center gap-1.5 text-xs text-ink-faint">
          <span className="h-3 w-3 rounded-full border border-ink-faint" />
          Pending (outline)
        </span>
      </div>

      {/* Monday.com-style horizontal calendar timeline */}
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-48 border-b border-r border-border bg-surface-muted px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-ink-muted">
                Team Member
              </th>
              {DAYS_OF_WEEK.map((day) => (
                <th
                  key={`head-${day}`}
                  className="border-b border-border bg-surface-muted px-3 py-3 text-center align-top"
                >
                  <div className="mb-2 text-xs font-bold uppercase tracking-wider text-ink-soft">
                    {DAY_LABELS[day]}
                  </div>
                  <div className="flex justify-center gap-1">
                    {SHIFT_TYPES.map((shift) => {
                      const slot = staffingByShift[day][shift];
                      const shortfall = slot.required - slot.actual;
                      return (
                        <div key={`indicator-${day}-${shift}`} className="group relative">
                          <span
                            className={`inline-flex h-6 min-w-6 cursor-default items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-transform duration-150 group-hover:scale-110 ${SHIFT_INDICATOR_SOFT_CLASSES[shift]}`}
                          >
                            {slot.actual}/{slot.required}
                          </span>

                          {/* Shift Registration Inspector — hover overlay */}
                          <div className="pointer-events-none absolute left-1/2 top-full z-30 hidden w-56 -translate-x-1/2 pt-2 group-hover:block">
                            <div className="panel pointer-events-auto p-3 text-left shadow-2xl">
                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                                {DAY_LABELS[day]} · {shift} · {SHIFT_LABELS[shift]}
                              </p>
                              {shortfall > 0 && (
                                <p className="mb-2 text-[11px] font-semibold text-danger">
                                  Short {shortfall} {shortfall === 1 ? 'person' : 'people'}
                                </p>
                              )}
                              {slot.people.length === 0 ? (
                                <p className="text-xs text-ink-faint">No one registered yet</p>
                              ) : (
                                <ul className="space-y-1">
                                  {slot.people.map((p, idx) => (
                                    <li
                                      key={`${p.email}-${idx}`}
                                      className="flex items-center justify-between gap-2 text-xs text-ink-soft"
                                    >
                                      <span className="truncate">{p.email}</span>
                                      <span
                                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                                          p.status === 'approved'
                                            ? 'bg-success/15 text-success'
                                            : 'bg-warning/15 text-warning'
                                        }`}
                                      >
                                        {p.status === 'approved' ? 'Approved' : 'Pending'}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-ink-muted">
                  No availabilities submitted for this week
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="group/row transition-colors duration-150 hover:bg-border/30">
                  <td className="sticky left-0 z-10 border-b border-r border-border bg-surface-muted px-4 py-3 group-hover/row:bg-border/30">
                    <div className="flex items-center gap-3">
                      <AvatarDisplay email={emp.email} avatarUrl={emp.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{emp.email}</p>
                        <p className="truncate text-[11px] text-ink-faint">ID: {emp.id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  {DAYS_OF_WEEK.map((day) => {
                    const shifts = cellShifts(emp.id, day);
                    return (
                      <td key={`cell-${emp.id}-${day}`} className="border-b border-border px-2 py-3 text-center">
                        {shifts.length === 0 ? (
                          <span className="text-border-strong">–</span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            {shifts.map(({ shift, status }) => (
                              <span
                                key={shift}
                                title={`${SHIFT_LABELS[shift]} · ${status}`}
                                className={`w-full rounded-md px-2 py-1 text-[10px] font-semibold capitalize transition-transform duration-150 hover:scale-105 ${
                                  status === 'approved' ? SHIFT_CHIP_CLASSES[shift] : SHIFT_CHIP_GHOST_CLASSES[shift]
                                }`}
                              >
                                {shift}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
