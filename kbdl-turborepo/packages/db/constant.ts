// constants.ts

export const ShiftStatus = {
  open: 'open',
  matched: 'matched',
  approved: 'approved',
  completed: 'completed',
  cancelled: 'cancelled',
} as const;

export type ShiftStatus = (typeof ShiftStatus)[keyof typeof ShiftStatus];
