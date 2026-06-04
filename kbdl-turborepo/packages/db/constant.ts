// constants.ts

export const ShiftStatus = {
  open: 'open',
  matched: 'matched',
  approved: 'approved',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export type ShiftStatus = (typeof ShiftStatus)[keyof typeof ShiftStatus];

export const EmploymentStatus = {
  active: 'active',
  inactive: 'inactive',
  terminated: 'terminated',
  resigned: 'resigned',
} as const;

export type EmploymentStatus = (typeof EmploymentStatus)[keyof typeof EmploymentStatus];
