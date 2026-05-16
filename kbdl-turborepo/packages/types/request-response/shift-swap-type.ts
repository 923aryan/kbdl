import { Rating, Shift } from '@repo/db/server';
import {
  acceptShiftSchema,
  cancelShiftSchema,
  createShiftSchema,
  getExtraShiftsSchema,
  getReferredEmployeeSchema,
  rateShiftSchema,
  updateShiftSchema,
} from '@repo/validator/shared';
import z from 'zod';

// A. Creation & Acceptance
export type CreateShiftRequest = z.infer<typeof createShiftSchema>;
export type CreateShiftPayload = z.infer<typeof createShiftSchema>['body'];
export type CreateShiftResponse = Shift;

export type AcceptShiftRequest = z.infer<typeof acceptShiftSchema>;
export type AcceptShiftPayload = z.infer<typeof acceptShiftSchema>['body'];
export type AcceptShiftResponse = Shift;

// B. View & Manage
export type UpdateShiftRequest = z.infer<typeof updateShiftSchema>;
export type UpdateShiftPayload = z.infer<typeof updateShiftSchema>['body'];
export type UpdateShiftResponse = Shift;

export type CancelShiftRequest = z.infer<typeof cancelShiftSchema>;
export type CancelShiftPayload = z.infer<typeof cancelShiftSchema>['body'];
export type CancelShiftResponse = Shift;

export type GetEmployeeShiftsResponse = Shift[];
export type GetEmployerShiftsResponse = Shift[];

// C. Extra Shifts
export type GetExtraShiftsRequest = z.infer<typeof getExtraShiftsSchema>;
export type GetExtraShiftsQuery = z.infer<typeof getExtraShiftsSchema>['query'];
export type GetExtraShiftsResponse = Shift[];

// D. Rating
export type RateShiftRequest = z.infer<typeof rateShiftSchema>;
export type RateShiftPayload = z.infer<typeof rateShiftSchema>['body'];
export type RateShiftResponse = Rating;

// E. Rating
export type getReferredEmployeeRequest = z.infer<typeof getReferredEmployeeSchema>;
export type getReferredEmployeePayload = z.infer<typeof getReferredEmployeeSchema>['body'];
export type getReferredEmployeeResponse = { id: string };
