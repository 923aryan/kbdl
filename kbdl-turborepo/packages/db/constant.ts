// constants.ts

export const ShiftStatus = {
  open: 'open',
  approved: 'approved',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export type ShiftStatus = (typeof ShiftStatus)[keyof typeof ShiftStatus];

export const ShiftApplicationStatus = {
  pending: 'pending',
  accepted: 'accepted',
  rejected: 'rejected',
  withdrawn: 'withdrawn',
} as const;
export type ShiftApplicationStatus =
  (typeof ShiftApplicationStatus)[keyof typeof ShiftApplicationStatus];

export const ShiftApplicationType = {
  invited: 'invited',
  applied: 'applied',
} as const;
export type ShiftApplicationType = (typeof ShiftApplicationType)[keyof typeof ShiftApplicationType];

export const EmploymentStatus = {
  active: 'active',
  inactive: 'inactive',
  terminated: 'terminated',
  resigned: 'resigned',
} as const;

export type EmploymentStatus = (typeof EmploymentStatus)[keyof typeof EmploymentStatus];
