// constants.ts

export const ShiftStatus = {
  open: 'open',
  approved: 'approved',
  completed: 'completed',
  cancelled: 'cancelled',
  rejected: 'rejected',
  absent: 'absent',
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

/** Why an employment stint ended (only when is_active=false). */
export const SeparationReason = {
  terminated: 'terminated',
  resigned: 'resigned',
  absconded: 'absconded',
  inactive: 'inactive',
} as const;

export type SeparationReason = (typeof SeparationReason)[keyof typeof SeparationReason];
