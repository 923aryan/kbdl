import { z } from 'zod';

const phoneValidation = z
  .string()
  .transform((val) => {
    const trimmed = val.trim();
    return /^\d{10}$/.test(trimmed) ? `+91${trimmed}` : trimmed;
  })
  .refine((val) => /^\+91\d{10}$/.test(val), {
    message: 'Phone number must strictly have +91 in front followed by a 10-digit number',
  });

const isAtLeast30MinsInFuture = (val: string) => {
  return new Date(val).getTime() >= Date.now() + 30 * 60 * 1000;
};

const isNotBeforeToday = (val: string) => {
  const inputDate = new Date(val);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Strip time, keep only the date
  return inputDate.getTime() >= today.getTime();
};

export const createShiftSchema = z.object({
  body: z
    .object({
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
      shift_date: z.iso
        .datetime({ message: 'Shift Date must be a valid ISO datetime string' })
        .refine(isNotBeforeToday, {
          message: 'Shift Date must not be in the past',
        }),
      shift_start: z.iso
        .datetime({ message: 'Shift Start must be a valid ISO datetime string' })
        .refine(isAtLeast30MinsInFuture, {
          message: 'Shift Start must be at least 30 minutes in the future',
        }),
      shift_end: z.iso
        .datetime({ message: 'Shift End must be a valid ISO datetime string' })
        .refine(isAtLeast30MinsInFuture, {
          message: 'Shift End must be at least 30 minutes in the future',
        }),
      skill_required: z
        .string()
        .min(1, 'Skill required cannot be empty')
        .max(255, 'Skill name is too long'),
    })
    .refine((data) => new Date(data.shift_end).getTime() > new Date(data.shift_start).getTime(), {
      message: 'Shift End must be strictly after Shift Start',
      path: ['shift_end'],
    }),
});

export const acceptShiftSchema = z.object({
  body: z.object({
    shift_id: z.string().uuid('Invalid shift ID format'),
  }),
});

export const updateShiftSchema = z.object({
  body: z
    .object({
      shift_id: z.string().uuid('Invalid shift ID format'),
      shift_date: z.iso
        .datetime()
        .refine(isNotBeforeToday, {
          message: 'Shift Date must not be in the past',
        })
        .optional(),
      shift_start: z.iso
        .datetime()
        .refine(isAtLeast30MinsInFuture, {
          message: 'Shift Start must be at least 30 minutes in the future',
        })
        .optional(),
      shift_end: z.iso
        .datetime()
        .refine(isAtLeast30MinsInFuture, {
          message: 'Shift End must be at least 30 minutes in the future',
        })
        .optional(),
      skill_required: z.string().max(255).optional(),
      replacement_employee_id: z.string().uuid().optional(),
    })
    .refine(
      (data) => {
        if (data.shift_start && data.shift_end) {
          return new Date(data.shift_end).getTime() > new Date(data.shift_start).getTime();
        }
        return true;
      },
      {
        message: 'Shift End must be strictly after Shift Start',
        path: ['shift_end'],
      },
    ),
});

export const getReferredEmployeeSchema = z.object({
  body: z.object({
    phone_no: phoneValidation,
  }),
});

export const cancelShiftSchema = z.object({
  body: z.object({
    shift_id: z.string().uuid('Invalid shift ID format'),
  }),
});

export const rejectShiftSchema = z.object({
  body: z.object({
    shift_id: z.string().uuid('Invalid shift ID format'),
  }),
});

export const getExtraShiftsSchema = z.object({
  query: z.object({
    skill: z.string().optional(),
    date: z.iso
      .datetime({ message: 'Date must be a valid ISO datetime string' })
      .refine(isNotBeforeToday, {
        message: 'Date must not be in the past',
      })
      .optional(),
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
