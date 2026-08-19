import { z } from 'zod';

const isoDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
  .refine((val) => {
    const d = new Date(`${val}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
  }, 'date must be a valid calendar date');

export const getEmployeeLeaveSchema = z.object({
  params: z.object({
    employmentId: z.string().uuid(),
  }),
  query: z
    .object({
      from: isoDateString.optional(),
      to: isoDateString.optional(),
    })
    .superRefine((q, ctx) => {
      if (q.from && q.to && q.from > q.to) {
        ctx.addIssue({ code: 'custom', message: 'from must be on or before to', path: ['from'] });
      }
    }),
});

export const createEmployeeLeaveSchema = z.object({
  params: z.object({
    employmentId: z.string().uuid(),
  }),
  body: z
    .object({
      leave_type_id: z.string().uuid().optional(),
      leave_type: z.string().trim().min(2).max(80).optional(),
      /** hr = employer/HR apply (auto-approved). manager = reporting manager apply (pending HR). */
      apply_as: z.enum(['hr', 'manager']).optional().default('hr'),
      from: isoDateString,
      to: isoDateString,
      reason: z.string().trim().min(2).max(300),
    })
    .superRefine((body, ctx) => {
      if (!body.leave_type_id && !body.leave_type) {
        ctx.addIssue({ code: 'custom', message: 'leave_type_id or leave_type is required', path: ['leave_type'] });
      }
      if (body.from > body.to) {
        ctx.addIssue({ code: 'custom', message: 'from must be on or before to', path: ['from'] });
      }
    }),
});

export const updateLeaveRequestSchema = z.object({
  params: z.object({
    requestId: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['approved', 'rejected']),
  }),
});

const boolQuery = z
  .enum(['true', 'false', '1', '0'])
  .optional()
  .transform((val) => val === 'true' || val === '1');

export const getCompanyLeaveCatalogSchema = z.object({
  query: z.object({
    include_inactive: boolQuery,
  }),
});

export const createCompanyLeaveTypeSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    days_per_year: z.coerce.number().min(0).max(366),
    is_paid: z.boolean().optional().default(true),
    sort_order: z.coerce.number().int().min(0).max(9999).optional(),
  }),
});

export const updateCompanyLeaveTypeSchema = z.object({
  params: z.object({
    typeId: z.string().uuid(),
  }),
  body: z
    .object({
      name: z.string().trim().min(2).max(80).optional(),
      days_per_year: z.coerce.number().min(0).max(366).optional(),
      is_paid: z.boolean().optional(),
      is_active: z.boolean().optional(),
      sort_order: z.coerce.number().int().min(0).max(9999).optional(),
    })
    .refine((body) => Object.keys(body).length > 0, { message: 'At least one field is required' }),
});

export const updateCompanyLeavePolicySchema = z.object({
  body: z.object({
    accrue_per_month: z.coerce.number().min(0).max(31).optional(),
    annual_quota: z.coerce.number().min(0).max(366).optional(),
    max_carry_forward: z.coerce.number().int().min(0).max(366).optional(),
    carry_forward_at_year_end: z.boolean().optional(),
    encash_excess: z.boolean().optional(),
    lines: z.array(z.string().trim().min(2).max(200)).min(1).max(20).optional(),
  }),
});

export const getCompanyLeaveRequestsSchema = z.object({
  query: z
    .object({
      search: z.string().trim().max(120).optional(),
      status: z.enum(['all', 'pending', 'approved', 'rejected']).optional().default('all'),
      from: isoDateString.optional(),
      to: isoDateString.optional(),
      page: z
        .string()
        .regex(/^\d+$/)
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 1))
        .refine((val) => val >= 1),
      limit: z
        .string()
        .regex(/^\d+$/)
        .optional()
        .transform((val) => (val ? parseInt(val, 10) : 10))
        .refine((val) => val >= 1 && val <= 100),
    })
    .superRefine((q, ctx) => {
      if (q.from && q.to && q.from > q.to) {
        ctx.addIssue({ code: 'custom', message: 'from must be on or before to', path: ['from'] });
      }
    }),
});
