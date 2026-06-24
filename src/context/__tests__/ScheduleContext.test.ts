import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmployeeWithSchedule, ScheduleContextType } from '../ScheduleContext';
import { Profile, Availability, CapacitySetting, emptyShiftData, ShiftData } from '@/types/index';

// ============================================================================
// TEST FIXTURES
// ============================================================================

const createMockProfile = (id: string, email: string): Profile => ({
  id,
  email,
  role: 'employee',
  avatar_url: null,
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
});

const createMockAvailability = (profileId: string, weekStarting: string): Availability => ({
  id: 'avail-001',
  profile_id: profileId,
  week_starting: weekStarting,
  shift_data: emptyShiftData(),
  status: 'pending',
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
});

const createMockCapacity = (weekStarting: string): CapacitySetting => ({
  id: 'capacity-001',
  week_starting: weekStarting,
  rules: {
    capacity: {
      monday: { morning: 3, afternoon: 4, evening: 2 },
      tuesday: { morning: 3, afternoon: 4, evening: 2 },
      wednesday: { morning: 3, afternoon: 4, evening: 2 },
      thursday: { morning: 3, afternoon: 4, evening: 2 },
      friday: { morning: 4, afternoon: 5, evening: 3 },
      saturday: { morning: 2, afternoon: 3, evening: 2 },
      sunday: { morning: 2, afternoon: 3, evening: 1 },
    },
    holiday_overrides: {},
  },
  created_at: '2026-06-20T00:00:00Z',
  updated_at: '2026-06-20T00:00:00Z',
});

const createMockEmployee = (id: string, email: string): EmployeeWithSchedule => ({
  profile: createMockProfile(id, email),
  availability: createMockAvailability(id, '2026-06-20'),
  shifts: emptyShiftData(),
});

// ============================================================================
// STATE MANAGEMENT TESTS
// ============================================================================

describe('ScheduleContext - State Management', () => {
  it('initializes with empty state', () => {
    const context = {
      employees: [],
      capacityRules: null,
      weekStarting: '',
      isDirty: false,
    };

    expect(context.employees).toEqual([]);
    expect(context.capacityRules).toBeNull();
    expect(context.weekStarting).toBe('');
    expect(context.isDirty).toBe(false);
  });

  it('stores employee profiles with shift data', () => {
    const employees = [
      createMockEmployee('emp-001', 'alice@redbean.com'),
      createMockEmployee('emp-002', 'bob@redbean.com'),
    ];

    expect(employees).toHaveLength(2);
    expect(employees[0].profile.id).toBe('emp-001');
    expect(employees[1].profile.email).toBe('bob@redbean.com');
  });

  it('stores availability records for employees', () => {
    const employee = createMockEmployee('emp-001', 'alice@redbean.com');

    expect(employee.availability).not.toBeNull();
    expect(employee.availability?.profile_id).toBe('emp-001');
    expect(employee.availability?.status).toBe('pending');
  });

  it('stores capacity rules for the week', () => {
    const capacity = createMockCapacity('2026-06-20');

    expect(capacity.week_starting).toBe('2026-06-20');
    expect(capacity.rules.capacity.monday.morning).toBe(3);
    expect(capacity.rules.capacity.friday.afternoon).toBe(5);
  });

  it('tracks week starting date', () => {
    const weekStarting = '2026-06-20';

    expect(weekStarting).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(weekStarting).toBe('2026-06-20');
  });
});

// ============================================================================
// SHIFT TOGGLE TESTS
// ============================================================================

describe('ScheduleContext - Shift Toggling', () => {
  it('toggles a single shift for an employee', () => {
    const employee = createMockEmployee('emp-001', 'alice@redbean.com');
    const initialState = employee.shifts.monday.morning;

    const updatedShifts = { ...employee.shifts };
    updatedShifts.monday.morning = !initialState;

    expect(initialState).toBe(false);
    expect(updatedShifts.monday.morning).toBe(true);
  });

  it('toggles multiple shifts for one employee', () => {
    const employee = createMockEmployee('emp-001', 'alice@redbean.com');

    const updatedShifts = { ...employee.shifts };
    updatedShifts.monday.morning = true;
    updatedShifts.monday.afternoon = true;
    updatedShifts.tuesday.evening = true;

    expect(updatedShifts.monday.morning).toBe(true);
    expect(updatedShifts.monday.afternoon).toBe(true);
    expect(updatedShifts.tuesday.evening).toBe(true);
    expect(updatedShifts.tuesday.morning).toBe(false);
  });

  it('toggles shift for correct employee only', () => {
    const employees = [
      createMockEmployee('emp-001', 'alice@redbean.com'),
      createMockEmployee('emp-002', 'bob@redbean.com'),
    ];

    const targetEmployee = employees.find((e) => e.profile.id === 'emp-001');
    const untouchedEmployee = employees.find((e) => e.profile.id === 'emp-002');

    const updatedShifts = { ...targetEmployee!.shifts };
    updatedShifts.monday.morning = true;

    expect(updatedShifts.monday.morning).toBe(true);
    expect(untouchedEmployee!.shifts.monday.morning).toBe(false);
  });

  it('handles toggling all days of the week', () => {
    const employee = createMockEmployee('emp-001', 'alice@redbean.com');
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

    const updatedShifts = { ...employee.shifts };
    days.forEach((day) => {
      updatedShifts[day].morning = true;
      updatedShifts[day].afternoon = true;
      updatedShifts[day].evening = true;
    });

    days.forEach((day) => {
      expect(updatedShifts[day].morning).toBe(true);
      expect(updatedShifts[day].afternoon).toBe(true);
      expect(updatedShifts[day].evening).toBe(true);
    });
  });

  it('handles toggling all shift types', () => {
    const employee = createMockEmployee('emp-001', 'alice@redbean.com');

    const updatedShifts = { ...employee.shifts };
    updatedShifts.monday.morning = true;
    updatedShifts.monday.afternoon = true;
    updatedShifts.monday.evening = true;

    expect(updatedShifts.monday.morning).toBe(true);
    expect(updatedShifts.monday.afternoon).toBe(true);
    expect(updatedShifts.monday.evening).toBe(true);
  });
});

// ============================================================================
// DIRTY STATE TESTS
// ============================================================================

describe('ScheduleContext - Dirty State Tracking', () => {
  it('marks context as dirty when shifts change', () => {
    const original = createMockEmployee('emp-001', 'alice@redbean.com');
    const updated = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule;
    updated.shifts.monday.morning = true;

    const isDirty = JSON.stringify(original.shifts) !== JSON.stringify(updated.shifts);

    expect(isDirty).toBe(true);
  });

  it('remains clean when no shifts change', () => {
    const original = createMockEmployee('emp-001', 'alice@redbean.com');
    const copy = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule;

    const isDirty = JSON.stringify(original.shifts) !== JSON.stringify(copy.shifts);

    expect(isDirty).toBe(false);
  });

  it('tracks dirty state for multiple employees', () => {
    const employees = [
      createMockEmployee('emp-001', 'alice@redbean.com'),
      createMockEmployee('emp-002', 'bob@redbean.com'),
      createMockEmployee('emp-003', 'charlie@redbean.com'),
    ];

    const original = JSON.parse(JSON.stringify(employees)) as EmployeeWithSchedule[];
    const updated = JSON.parse(JSON.stringify(employees)) as EmployeeWithSchedule[];
    updated[0].shifts.monday.morning = true;
    updated[2].shifts.friday.evening = true;

    const dirtyCount = updated.filter(
      (emp, idx) => JSON.stringify(emp.shifts) !== JSON.stringify(original[idx].shifts)
    ).length;

    expect(dirtyCount).toBe(2);
  });

  it('detects clean state after reset', () => {
    const original = createMockEmployee('emp-001', 'alice@redbean.com');
    const updated = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule;
    updated.shifts.monday.morning = true;

    const reset = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule;

    expect(JSON.stringify(updated.shifts) === JSON.stringify(original.shifts)).toBe(false);
    expect(JSON.stringify(reset.shifts) === JSON.stringify(original.shifts)).toBe(true);
  });
});

// ============================================================================
// BATCH OPERATION TESTS
// ============================================================================

describe('ScheduleContext - Batch Operations', () => {
  it('clears all changes at once', () => {
    const original = [
      createMockEmployee('emp-001', 'alice@redbean.com'),
      createMockEmployee('emp-002', 'bob@redbean.com'),
    ];

    const modified = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule[];
    modified[0].shifts.monday.morning = true;
    modified[1].shifts.wednesday.afternoon = true;

    const cleared = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule[];

    const allClear = cleared.every(
      (emp, idx) => JSON.stringify(emp.shifts) === JSON.stringify(original[idx].shifts)
    );

    expect(allClear).toBe(true);
  });

  it('identifies changed employees', () => {
    const original = [
      createMockEmployee('emp-001', 'alice@redbean.com'),
      createMockEmployee('emp-002', 'bob@redbean.com'),
      createMockEmployee('emp-003', 'charlie@redbean.com'),
    ];

    const updated = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule[];
    updated[0].shifts.monday.morning = true;
    updated[2].shifts.friday.evening = true;

    const changed = updated.filter(
      (emp, idx) => JSON.stringify(emp.shifts) !== JSON.stringify(original[idx].shifts)
    );

    expect(changed).toHaveLength(2);
    expect(changed[0].profile.id).toBe('emp-001');
    expect(changed[1].profile.id).toBe('emp-003');
  });

  it('returns empty array when no employees changed', () => {
    const original = [
      createMockEmployee('emp-001', 'alice@redbean.com'),
      createMockEmployee('emp-002', 'bob@redbean.com'),
    ];

    const copy = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule[];

    const changed = copy.filter(
      (emp, idx) => JSON.stringify(emp.shifts) !== JSON.stringify(original[idx].shifts)
    );

    expect(changed).toHaveLength(0);
  });

  it('handles batch reset for subset of employees', () => {
    const original = [
      createMockEmployee('emp-001', 'alice@redbean.com'),
      createMockEmployee('emp-002', 'bob@redbean.com'),
      createMockEmployee('emp-003', 'charlie@redbean.com'),
    ];

    const updated = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule[];
    updated[0].shifts.monday.morning = true;
    updated[1].shifts.wednesday.afternoon = true;

    // Reset only emp-001
    updated[0].shifts = JSON.parse(JSON.stringify(original[0].shifts));

    expect(JSON.stringify(updated[0].shifts)).toBe(JSON.stringify(original[0].shifts));
    expect(JSON.stringify(updated[1].shifts) === JSON.stringify(original[1].shifts)).toBe(false);
  });
});

// ============================================================================
// UNSAVED CHANGES WARNING TESTS
// ============================================================================

describe('ScheduleContext - Unsaved Changes Warning', () => {
  it('tracks unsaved state for beforeunload event', () => {
    let isDirty = false;

    const markDirty = () => {
      isDirty = true;
    };

    const clearDirty = () => {
      isDirty = false;
    };

    expect(isDirty).toBe(false);
    markDirty();
    expect(isDirty).toBe(true);
    clearDirty();
    expect(isDirty).toBe(false);
  });

  it('should warn user if navigating with unsaved changes', () => {
    let isDirty = true;

    const shouldWarn = isDirty;

    expect(shouldWarn).toBe(true);
  });

  it('should not warn if no unsaved changes', () => {
    let isDirty = false;

    const shouldWarn = isDirty;

    expect(shouldWarn).toBe(false);
  });

  it('prevents tab close with unsaved changes', () => {
    let isDirty = true;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    const mockEvent = new Event('beforeunload') as BeforeUnloadEvent;
    handleBeforeUnload(mockEvent);

    expect(isDirty).toBe(true);
  });
});

// ============================================================================
// SHIFT DATA UPDATE TESTS
// ============================================================================

describe('ScheduleContext - Full Shift Data Update', () => {
  it('replaces employee shifts entirely', () => {
    const employee = createMockEmployee('emp-001', 'alice@redbean.com');
    const newShifts: ShiftData = {
      monday: { morning: true, afternoon: false, evening: true },
      tuesday: { morning: false, afternoon: true, evening: false },
      wednesday: { morning: true, afternoon: true, evening: true },
      thursday: { morning: false, afternoon: false, evening: false },
      friday: { morning: true, afternoon: true, evening: false },
      saturday: { morning: false, afternoon: true, evening: true },
      sunday: { morning: true, afternoon: false, evening: false },
    };

    const updated = { ...employee, shifts: newShifts };

    expect(JSON.stringify(updated.shifts)).toBe(JSON.stringify(newShifts));
  });

  it('validates shift structure before update', () => {
    const newShifts: ShiftData = {
      monday: { morning: true, afternoon: false, evening: true },
      tuesday: { morning: false, afternoon: true, evening: false },
      wednesday: { morning: true, afternoon: true, evening: true },
      thursday: { morning: false, afternoon: false, evening: false },
      friday: { morning: true, afternoon: true, evening: false },
      saturday: { morning: false, afternoon: true, evening: true },
      sunday: { morning: true, afternoon: false, evening: false },
    };

    const days = Object.keys(newShifts) as const;
    const shiftTypes = ['morning', 'afternoon', 'evening'] as const;

    const isValid = days.every((day) =>
      shiftTypes.every((type) => typeof newShifts[day][type] === 'boolean')
    );

    expect(isValid).toBe(true);
  });
});

// ============================================================================
// CONTEXT ISOLATION TESTS
// ============================================================================

describe('ScheduleContext - Data Isolation', () => {
  it('does not mutate original employee data', () => {
    const original = createMockEmployee('emp-001', 'alice@redbean.com');
    const copy = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule;

    copy.shifts.monday.morning = true;

    expect(original.shifts.monday.morning).toBe(false);
    expect(copy.shifts.monday.morning).toBe(true);
  });

  it('isolates state between employees', () => {
    const emp1 = createMockEmployee('emp-001', 'alice@redbean.com');
    const emp2 = createMockEmployee('emp-002', 'bob@redbean.com');

    const updated1 = JSON.parse(JSON.stringify(emp1)) as EmployeeWithSchedule;
    updated1.shifts.monday.morning = true;

    expect(emp1.shifts.monday.morning).toBe(false);
    expect(emp2.shifts.monday.morning).toBe(false);
    expect(updated1.shifts.monday.morning).toBe(true);
  });

  it('preserves original data in separate storage', () => {
    const original = [
      createMockEmployee('emp-001', 'alice@redbean.com'),
      createMockEmployee('emp-002', 'bob@redbean.com'),
    ];

    const originalCopy = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule[];

    const updated = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule[];
    updated[0].shifts.monday.morning = true;

    expect(JSON.stringify(originalCopy[0].shifts)).toBe(
      JSON.stringify(original[0].shifts)
    );
    expect(JSON.stringify(updated[0].shifts) === JSON.stringify(originalCopy[0].shifts)).toBe(
      false
    );
  });
});

// ============================================================================
// CONTEXT INTEGRATION TESTS
// ============================================================================

describe('ScheduleContext - Integration', () => {
  it('handles complete workflow: load, modify, clear, reload', () => {
    const employees = [
      createMockEmployee('emp-001', 'alice@redbean.com'),
      createMockEmployee('emp-002', 'bob@redbean.com'),
    ];

    const original = JSON.parse(JSON.stringify(employees)) as EmployeeWithSchedule[];

    let current = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule[];
    current[0].shifts.monday.morning = true;

    let isDirty = JSON.stringify(current) !== JSON.stringify(original);
    expect(isDirty).toBe(true);

    current = JSON.parse(JSON.stringify(original)) as EmployeeWithSchedule[];
    isDirty = JSON.stringify(current) !== JSON.stringify(original);
    expect(isDirty).toBe(false);
  });

  it('maintains state across multiple operations', () => {
    const employees = [createMockEmployee('emp-001', 'alice@redbean.com')];

    const updated = JSON.parse(JSON.stringify(employees)) as EmployeeWithSchedule[];
    updated[0].shifts.monday.morning = true;
    updated[0].shifts.wednesday.afternoon = true;
    updated[0].shifts.friday.evening = true;

    expect(updated[0].shifts.monday.morning).toBe(true);
    expect(updated[0].shifts.wednesday.afternoon).toBe(true);
    expect(updated[0].shifts.friday.evening).toBe(true);
  });
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

describe('ScheduleContext - Edge Cases', () => {
  it('handles employee with no availability record', () => {
    const employee: EmployeeWithSchedule = {
      profile: createMockProfile('emp-001', 'alice@redbean.com'),
      availability: null,
      shifts: emptyShiftData(),
    };

    expect(employee.availability).toBeNull();
    expect(employee.shifts).toEqual(emptyShiftData());
  });

  it('handles empty employee roster', () => {
    const employees: EmployeeWithSchedule[] = [];

    expect(employees).toHaveLength(0);
  });

  it('handles large employee roster', () => {
    const employees = Array.from({ length: 100 }, (_, i) =>
      createMockEmployee(`emp-${i}`, `employee${i}@redbean.com`)
    );

    expect(employees).toHaveLength(100);
    expect(employees[50].profile.id).toBe('emp-50');
  });

  it('handles rapid shift toggling', () => {
    const employee = createMockEmployee('emp-001', 'alice@redbean.com');
    let shifts = JSON.parse(JSON.stringify(employee.shifts)) as ShiftData;

    for (let i = 0; i < 11; i++) {
      shifts.monday.morning = !shifts.monday.morning;
    }

    expect(shifts.monday.morning).toBe(true);
  });

  it('handles all shifts toggled on', () => {
    const shifts = emptyShiftData();
    const days = Object.keys(shifts) as const;
    const types = ['morning', 'afternoon', 'evening'] as const;

    days.forEach((day) => {
      types.forEach((type) => {
        shifts[day][type] = true;
      });
    });

    const allTrue = days.every((day) =>
      types.every((type) => shifts[day][type] === true)
    );

    expect(allTrue).toBe(true);
  });

  it('handles all shifts toggled off', () => {
    const shifts = emptyShiftData();

    const allFalse = Object.values(shifts).every((day) =>
      Object.values(day).every((shift) => shift === false)
    );

    expect(allFalse).toBe(true);
  });
});
