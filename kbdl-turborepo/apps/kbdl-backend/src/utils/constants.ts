export const ROLES = {
  USER: 'user',
  EMPLOYER: 'employer',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ShiftStatus = {
  open: 'open',
  matched: 'matched',
  approved: 'approved',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export type ShiftStatus = (typeof ShiftStatus)[keyof typeof ShiftStatus];
