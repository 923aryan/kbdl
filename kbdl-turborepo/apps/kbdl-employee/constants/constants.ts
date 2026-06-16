export const ROLES = {
  USER: 'user',
  EMPLOYER: 'employer',
  ADMIN: 'admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

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

export const OTP_ROLES = {
  USER_REGISTER: 'USER_REGISTER',
  USER_LOGIN: 'USER_LOGIN',
  EMPLOYER_REGISTER: 'EMPLOYER_REGISTER',
  EMPLOYER_LOGIN: 'EMPLOYER_LOGIN',
} as const;

export const EmploymentStatus = {
  pending: 'pending',
  active: 'active',
  inactive: 'inactive',
  terminated: 'terminated',
  resigned: 'resigned',
} as const;

export type EmploymentStatus = (typeof EmploymentStatus)[keyof typeof EmploymentStatus];

export const NotificationTypes = {
  shiftSwapRequest: 'shift_swap_request',
  publicShiftSwap: 'public_shift',
  onboardRequest: 'onboard_request',
  shiftApproved: 'shift_approved',
} as const;

export type NotificationTypes = (typeof NotificationTypes)[keyof typeof NotificationTypes];

export const SalaryType = {
  hourly: 'hourly',
  daily: 'daily',
  weekly: 'weekly',
  monthly: 'monthly',
} as const;

export type SalaryType = (typeof SalaryType)[keyof typeof SalaryType];

export const JobStatus = {
  draft: 'draft',
  open: 'open',
  paused: 'paused',
  closed: 'closed',
  expired: 'expired',
} as const;

export type JobStatus = (typeof JobStatus)[keyof typeof JobStatus];

export const EmploymentType = {
  full_time: 'full_time',
  part_time: 'part_time',
  contract: 'contract',
  temporary: 'temporary',
  internship: 'internship',
  freelance: 'freelance',
} as const;

export type EmploymentType = (typeof EmploymentType)[keyof typeof EmploymentType];

export const JobWorkType = {
  onsite: 'onsite',
  remote: 'remote',
  hybrid: 'hybrid',
} as const;

export type JobWorkType = (typeof JobWorkType)[keyof typeof JobWorkType];

export const JobApplicationStatus = {
  applied: 'applied',
  under_review: 'under_review',
  shortlisted: 'shortlisted',
  interview_scheduled: 'interview_scheduled',
  selected: 'selected',
  hired: 'hired',
  rejected: 'rejected',
  withdrawn: 'withdrawn',
} as const;

export type JobApplicationStatus = (typeof JobApplicationStatus)[keyof typeof JobApplicationStatus];
