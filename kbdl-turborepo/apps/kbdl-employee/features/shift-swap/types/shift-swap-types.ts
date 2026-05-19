import { Prisma, safeEmployerSelect, safeUserSelect, Shift } from "@repo/db";

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof safeUserSelect;
}>;

export type SafeEmployer = Prisma.EmployerGetPayload<{
  select: typeof safeEmployerSelect;
}>;


export type OpenShift = Shift & {
  original_employee: SafeUser;
  employer: SafeEmployer;
};