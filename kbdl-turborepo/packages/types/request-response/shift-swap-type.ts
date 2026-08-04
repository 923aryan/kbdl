import {
  EmployerDto,
  Prisma,
  Rating,
  Shift,
  ShiftApplication,
  User,
} from '@repo/db/server';
import { safeUserSelect } from '@repo/db/shared';

import {
  acceptShiftSchema,
  approveShiftCompletionSchema,
  approveShiftSchema,
  cancelShiftSchema,
  createShiftSchema,
  getBestShiftMatchesSchema,
  getEmployerShiftsSchema,
  getExtraShiftsSchema,
  getLatestShiftsSchema,
  getPendingShiftsSchema,
  getReferredEmployeeSchema,
  getShiftDetailsSchema,
  rateShiftSchema,
  rejectShiftSchema,
  reportShiftNoShowSchema,
  syncSavedShiftsSchema,
  updateShiftSchema,
  withdrawShiftApplicationSchema,
  getPublicShiftsSchema,
  getPublicShiftDetailsSchema,
} from '@repo/validator/shared';
import z from 'zod';

type Employer = EmployerDto;

// A. Creation & Acceptance
export type CreateShiftRequest = z.infer<typeof createShiftSchema>;
export type CreateShiftPayload = z.infer<typeof createShiftSchema>['body'];
export type CreateShiftResponse = Shift & { employer_id: string };

export type AcceptShiftRequest = z.infer<typeof acceptShiftSchema>;
export type AcceptShiftPayload = z.infer<typeof acceptShiftSchema>['body'];
export type AcceptShiftResponse = Shift & { employer_id: string };

export type ApplyForPublicShiftRequest = z.infer<typeof acceptShiftSchema>;
export type ApplyForPublicShiftPayload = z.infer<typeof acceptShiftSchema>['body'];
export type ApplyForPublicShiftResponse = ShiftApplication;

// B. View & Manage
export type UpdateShiftRequest = z.infer<typeof updateShiftSchema>;
export type UpdateShiftPayload = z.infer<typeof updateShiftSchema>['body'];
export type UpdateShiftResponse = Shift & { employer_id: string };

export type CancelShiftRequest = z.infer<typeof cancelShiftSchema>;
export type CancelShiftPayload = z.infer<typeof cancelShiftSchema>['body'];
export type CancelShiftResponse = Shift & { employer_id: string };

export type WithdrawShiftApplicationRequest = z.infer<typeof withdrawShiftApplicationSchema>;
export type WithdrawShiftApplicationPayload = z.infer<
  typeof withdrawShiftApplicationSchema
>['body'];
export type WithdrawShiftApplicationResponse = ShiftApplication;

export type GetEmployeeShiftsResponse = (Shift & {
  employer_id: string;
  employer: EmployerDto;

  original_employee: Prisma.UserGetPayload<{
    select: typeof safeUserSelect;
  }>;

  shiftApplication: ShiftApplication | null;
})[];
export type GetScheduledShiftsResponse = GetEmployeeShiftsResponse;
export type GetEmployerShiftsRequest = z.infer<typeof getEmployerShiftsSchema>;
export type GetEmployerShiftsQuery = z.infer<typeof getEmployerShiftsSchema>['query'];
export type GetEmployerShiftsResponse = (Shift & {
  employer_id: string;
  original_employee: Pick<User, 'name' | 'phone_no' | 'skills'> | null;
  replacement_employee: Pick<User, 'name' | 'phone_no' | 'skills'> | null;
})[];
export type GetCreatedShiftsForEmployeeResponse = (Shift & {
  employer_id: string;
  employer: Pick<Employer, 'company_name' | 'company_address'> | null;
  replacement_employee: Pick<User, 'name' | 'phone_no'> | null;
})[];

export type GetPendingShiftsRequest = z.infer<typeof getPendingShiftsSchema>;
export type GetPendingShiftsQuery = z.infer<typeof getPendingShiftsSchema>['query'];
type PendingShiftApplication = ShiftApplication & {
  user: {
    name: string | null;
    phone_no: string;
  };
  shift: Shift & {
    employer_id: string;
    original_employee: {
      name: string | null;
      phone_no: string;
    };
    employer: EmployerDto;
  };
};

export type GetPendingShiftsResponse = PendingShiftApplication[];

export type GetEmployerShiftAnalyticsResponse = {
  totalShifts: number;
  openShifts: number;
  approvedShifts: number;
  completedShifts: number;
  cancelledShifts: number;
  totalApplications: number;
  pendingApplications: number;
};

// C. Extra Shifts
export type GetExtraShiftsRequest = z.infer<typeof getExtraShiftsSchema>;
export type GetExtraShiftsQuery = z.infer<typeof getExtraShiftsSchema>['query'];
export type GetExtraShiftsResponse = (Shift & {
  employer_id: string;
  employer: Pick<Employer, 'company_name' | 'company_address'> & {
    company_location: [number, number];
  };
})[];

export type ShiftWithDistance = Shift & {
  employer_id: string;
  employer: Pick<Employer, 'company_name' | 'company_address' | 'is_verified'>;
  distance_in_km: number;
};

export type GetLatestShiftsRequest = z.infer<typeof getLatestShiftsSchema>;
export type GetLatestShiftsQuery = z.infer<typeof getLatestShiftsSchema>['query'];
export type GetLatestShiftsResponse = ShiftWithDistance[];

export type GetBestShiftMatchesRequest = z.infer<typeof getBestShiftMatchesSchema>;
export type GetBestShiftMatchesQuery = z.infer<typeof getBestShiftMatchesSchema>['query'];
export type GetBestShiftMatchesResponse = ShiftWithDistance[];

// D. Rating
export type RateShiftRequest = z.infer<typeof rateShiftSchema>;
export type RateShiftPayload = z.infer<typeof rateShiftSchema>['body'];
export type RateShiftResponse = Rating;

// E. Rating
export type getReferredEmployeeRequest = z.infer<typeof getReferredEmployeeSchema>;
export type getReferredEmployeePayload = z.infer<typeof getReferredEmployeeSchema>['body'];
export type getReferredEmployeeResponse = { id: string };

//F. Open Shifts
export type ShiftWithNotification = Shift & {
  employer_id: string;
  notificationId?: string | null;

  original_employee: Prisma.UserGetPayload<{
    select: typeof safeUserSelect;
  }>;

  employer: EmployerDto;

  shiftApplication?: ShiftApplication | null;
};

export type GetOpenShiftsForEmployeeResponse = ShiftWithNotification[];

export type ApproveShiftRequest = z.infer<typeof approveShiftSchema>;
export type ApproveShiftPayload = z.infer<typeof approveShiftSchema>['params'];
export type ApproveShiftResponse = Shift & { employer_id: string };

export type RejectShiftRequest = z.infer<typeof rejectShiftSchema>;
export type RejectShiftResponse = ShiftApplication;

export type GetShiftDetailsRequest = z.infer<typeof getShiftDetailsSchema>;
export type GetShiftDetailsQuery = z.infer<typeof getShiftDetailsSchema>['query'];
export type GetShiftDetailsResponse = Shift & {
  employer_id: string;
  original_employee: Prisma.UserGetPayload<{
    select: typeof safeUserSelect;
  }>;

  replacement_employee: Prisma.UserGetPayload<{
    select: typeof safeUserSelect;
  }> | null;

  employer: EmployerDto;

  shiftApplications: Array<
    ShiftApplication & {
      user: Prisma.UserGetPayload<{
        select: typeof safeUserSelect;
      }>;
    }
  >;
};
export type ApproveShiftCompletionRequest = z.infer<typeof approveShiftCompletionSchema>;
export type ApproveShiftCompletionResponse = Shift & { employer_id: string };

export type ReportShiftNoShowRequest = z.infer<typeof reportShiftNoShowSchema>;
export type ReportShiftNoShowResponse = Shift & { employer_id: string };

export type SyncSavedShiftsRequest = z.infer<typeof syncSavedShiftsSchema>;
export type SyncSavedShiftsPayload = z.infer<typeof syncSavedShiftsSchema>['body'];
export type SyncSavedShiftsResponse = GetEmployeeShiftsResponse;

export type GetPublicShiftsRequest = z.infer<typeof getPublicShiftsSchema>;
export type GetPublicShiftsQuery = z.infer<typeof getPublicShiftsSchema>['query'];
export type GetPublicShiftsResponse = (Shift & {
  employer_id: string;
  employer: Pick<Employer, 'company_name' | 'company_address'>;
  seo_title: string;
})[];

export type GetPublicShiftDetailsRequest = z.infer<typeof getPublicShiftDetailsSchema>;
export type GetPublicShiftDetailsParams = z.infer<typeof getPublicShiftDetailsSchema>['params'];
export type GetPublicShiftDetailsResponse = Shift & {
  employer_id: string;
  employer: Pick<Employer, 'company_name' | 'company_address'>;
  seo_title: string;
};
