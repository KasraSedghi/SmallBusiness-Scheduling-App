'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Profile, Availability, CapacitySetting, ShiftData, DayOfWeek, ShiftType } from '@/types/index';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface EmployeeWithSchedule {
  profile: Profile;
  availability: Availability | null;
  shifts: ShiftData;
}

export interface ScheduleContextType {
  // State
  employees: EmployeeWithSchedule[];
  capacityRules: CapacitySetting | null;
  weekStarting: string;
  isDirty: boolean;

  // Actions
  setEmployees: (employees: EmployeeWithSchedule[]) => void;
  setCapacityRules: (rules: CapacitySetting) => void;
  setWeekStarting: (date: string) => void;

  // Shift manipulation
  toggleShift: (employeeId: string, day: DayOfWeek, shiftType: ShiftType) => void;
  updateEmployeeShifts: (employeeId: string, shifts: ShiftData) => void;
  resetEmployeeShifts: (employeeId: string) => void;

  // Batch operations
  clearAllChanges: () => void;
  getChangedEmployees: () => EmployeeWithSchedule[];
}

// ============================================================================
// CONTEXT CREATION
// ============================================================================

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface ScheduleProviderProps {
  children: React.ReactNode;
}

export function ScheduleProvider({ children }: ScheduleProviderProps) {
  const [employees, setEmployeesState] = useState<EmployeeWithSchedule[]>([]);
  const [capacityRules, setCapacityRulesState] = useState<CapacitySetting | null>(null);
  const [weekStarting, setWeekStartingState] = useState<string>('');
  const [originalEmployees, setOriginalEmployees] = useState<EmployeeWithSchedule[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  // Warn on unsaved changes before navigation or refresh
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Check for unsaved changes
  const checkDirtyState = useCallback((updatedEmployees: EmployeeWithSchedule[]) => {
    const hasChanges = updatedEmployees.some((emp, idx) => {
      const original = originalEmployees[idx];
      if (!original) return true;
      return JSON.stringify(emp.shifts) !== JSON.stringify(original.shifts);
    });
    setIsDirty(hasChanges);
  }, [originalEmployees]);

  const setEmployees = useCallback((newEmployees: EmployeeWithSchedule[]) => {
    setEmployeesState(newEmployees);
    setOriginalEmployees(JSON.parse(JSON.stringify(newEmployees)));
    setIsDirty(false);
  }, []);

  const setCapacityRules = useCallback((rules: CapacitySetting) => {
    setCapacityRulesState(rules);
  }, []);

  const setWeekStarting = useCallback((date: string) => {
    setWeekStartingState(date);
  }, []);

  const toggleShift = useCallback(
    (employeeId: string, day: DayOfWeek, shiftType: ShiftType) => {
      const updatedEmployees = employees.map((emp) => {
        if (emp.profile.id === employeeId) {
          const updatedShifts = { ...emp.shifts };
          updatedShifts[day][shiftType] = !updatedShifts[day][shiftType];
          return { ...emp, shifts: updatedShifts };
        }
        return emp;
      });

      setEmployeesState(updatedEmployees);
      checkDirtyState(updatedEmployees);
    },
    [employees, checkDirtyState]
  );

  const updateEmployeeShifts = useCallback(
    (employeeId: string, shifts: ShiftData) => {
      const updatedEmployees = employees.map((emp) => {
        if (emp.profile.id === employeeId) {
          return { ...emp, shifts };
        }
        return emp;
      });

      setEmployeesState(updatedEmployees);
      checkDirtyState(updatedEmployees);
    },
    [employees, checkDirtyState]
  );

  const resetEmployeeShifts = useCallback(
    (employeeId: string) => {
      const updatedEmployees = employees.map((emp) => {
        if (emp.profile.id === employeeId) {
          const original = originalEmployees.find((o) => o.profile.id === employeeId);
          if (original) {
            return { ...emp, shifts: JSON.parse(JSON.stringify(original.shifts)) };
          }
        }
        return emp;
      });

      setEmployeesState(updatedEmployees);
      checkDirtyState(updatedEmployees);
    },
    [employees, originalEmployees, checkDirtyState]
  );

  const clearAllChanges = useCallback(() => {
    setEmployeesState(JSON.parse(JSON.stringify(originalEmployees)));
    setIsDirty(false);
  }, [originalEmployees]);

  const getChangedEmployees = useCallback((): EmployeeWithSchedule[] => {
    return employees.filter((emp, idx) => {
      const original = originalEmployees[idx];
      if (!original) return true;
      return JSON.stringify(emp.shifts) !== JSON.stringify(original.shifts);
    });
  }, [employees, originalEmployees]);

  const value: ScheduleContextType = {
    employees,
    capacityRules,
    weekStarting,
    isDirty,
    setEmployees,
    setCapacityRules,
    setWeekStarting,
    toggleShift,
    updateEmployeeShifts,
    resetEmployeeShifts,
    clearAllChanges,
    getChangedEmployees,
  };

  return <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useScheduleContext(): ScheduleContextType {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useScheduleContext must be used within ScheduleProvider');
  }
  return context;
}
