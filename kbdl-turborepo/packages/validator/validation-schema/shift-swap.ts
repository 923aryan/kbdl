import { z } from 'zod';

export const createShiftSchema = z.object({
  body: z.object({
    original_employee_id: z.string().uuid('Invalid original employee ID format').optional(), // Optional because a worker creating it might rely on their own auth token, while an employer must provide it.
    replacement_employee_id: z.string().uuid('Invalid replacement employee ID format').optional(), // Optional for public shift requests
    payType: z.enum(['HOURLY', 'FIXED'], {
      message: 'Pay Type must be either HOURLY or FIXED',
    }),
    shift_pay: z
      .number({
        message: 'Shift Pay must be a number',
      })
      .positive('Shift Pay must be greater than 0'),
    shift_date: z.string().datetime({ message: 'Shift Date must be a valid ISO datetime string' }),
    shift_start: z
      .string()
      .datetime({ message: 'Shift Start must be a valid ISO datetime string' }),
    shift_end: z.string().datetime({ message: 'Shift End must be a valid ISO datetime string' }),
    skill_required: z
      .string()
      .min(1, 'Skill required cannot be empty')
      .max(255, 'Skill name is too long'),
  }),
});

export const acceptShiftSchema = z.object({
  body: z.object({
    shift_id: z.string().uuid('Invalid shift ID format'),
  }),
});

export const updateShiftSchema = z.object({
  body: z.object({
    shift_id: z.string().uuid('Invalid shift ID format'),
    shift_date: z.string().datetime().optional(),
    shift_start: z.string().datetime().optional(),
    shift_end: z.string().datetime().optional(),
    skill_required: z.string().max(255).optional(),
    replacement_employee_id: z.string().uuid().optional(),
  }),
});

export const getReferredEmployeeSchema = z.object({
  body: z.object({
    phone_no: z
      .string()
      .min(10, 'Phone number must be at least 10 characters')
      .max(15, 'Phone number is too long')
      .regex(/^\+?[0-9]+$/, "Phone number can only contain numbers and an optional leading '+'"),
  }),
});

export const cancelShiftSchema = z.object({
  body: z.object({
    shift_id: z.string().uuid('Invalid shift ID format'),
  }),
});

export const getExtraShiftsSchema = z.object({
  query: z.object({
    skill: z.string().optional(),
    date: z.string().datetime({ message: 'Date must be a valid ISO datetime string' }).optional(),
    latitude: z.coerce.number().min(-90).max(90),
    radius: z.coerce.number().optional().default(10),
    longitude: z.coerce.number().min(-180).max(180),
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
  }),
});

export const getLatestShiftsSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
  }),
});

export const getBestShiftMatchesSchema = z.object({
  query: z.object({
    limit: z
      .string()
      .regex(/^\d+$/, 'Limit must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 10)),
    page: z
      .string()
      .regex(/^\d+$/, 'Page must be a number')
      .optional()
      .transform((val) => (val ? parseInt(val, 10) : 1)),
  }),
});

export const rateShiftSchema = z.object({
  body: z.object({
    shift_id: z.string().uuid('Invalid shift ID format'),
    user_id: z.string().uuid('Invalid rated user ID format'),
    score: z
      .number()
      .int('Score must be an integer')
      .min(1, 'Minimum score is 1')
      .max(5, 'Maximum score is 5'),
    flagged_issue: z.boolean().default(false),
  }),
});

export const getPendingShiftsSchema = z.object({});

export const approveShiftSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shift ID format'),
  }),
});

export const rejectShiftSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shift ID format'),
  }),
});

export const getShiftDetailsSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shift ID format'),
  }),
});

export const approveShiftCompletionSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shift ID format'),
  }),
});

export const reportShiftNoShowSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid shift ID format'),
  }),
});
