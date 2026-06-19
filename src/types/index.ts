// User types
export interface User {
  id: string;
  email: string;
  role: 'employee' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

// Shift types
export interface Shift {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  hoursPerShift: number;
}

// Schedule submission types
export interface ScheduleSubmission {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  selectedShifts: Shift[];
  totalHours: number;
  submittedAt: Date;
  approvedAt?: Date;
  approvedBy?: string;
  week: number;
  year: number;
}

// Time-off request types
export interface TimeOffRequest {
  id: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

// Notification types
export interface EmailNotification {
  id: string;
  userId: string;
  type: 'reminder' | 'approval' | 'rejection';
  sentAt: Date;
  subject: string;
  content: string;
}
