import { Lead } from '@repo/db/server';

import {
  createLeadSchema,
  deleteLeadSchema,
  getLeadByIdSchema,
  resolveLeadSchema,
} from '@repo/validator/shared';

import z from 'zod';

// A. Create Lead
export type CreateLeadRequest = z.infer<typeof createLeadSchema>;
export type CreateLeadPayload = z.infer<typeof createLeadSchema>['body'];
export type CreateLeadResponse = Lead;

// B. Get All Leads
export type GetAllLeadsResponse = Lead[];

// C. Get Lead By ID
export type GetLeadByIdRequest = z.infer<typeof getLeadByIdSchema>;
export type GetLeadByIdParams = z.infer<typeof getLeadByIdSchema>['params'];
export type GetLeadByIdResponse = Lead;

// D. Resolve Lead
export type ResolveLeadRequest = z.infer<typeof resolveLeadSchema>;
export type ResolveLeadParams = z.infer<typeof resolveLeadSchema>['params'];
export type ResolveLeadResponse = Lead;

// E. Delete Lead
export type DeleteLeadRequest = z.infer<typeof deleteLeadSchema>;
export type DeleteLeadParams = z.infer<typeof deleteLeadSchema>['params'];
export type DeleteLeadResponse = Lead;
