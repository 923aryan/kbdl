import { Prisma, safeEmployerSelect, safeUserSelect, Shift, ShiftApplication } from '@repo/db';

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

export type SafeEmployer = Prisma.EmployerGetPayload<{
  select: typeof safeEmployerSelect;
}>;

export type OpenShift = Shift & {
  notificationId?: string;
  original_employee: SafeUser;
  employer: SafeEmployer;
  shiftApplication?: ShiftApplication | null;
};
