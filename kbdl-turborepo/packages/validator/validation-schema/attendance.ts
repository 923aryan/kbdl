import { z } from 'zod';

const isoDateString = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must be YYYY-MM-DD')
  .refine((val) => {
    const d = new Date(`${val}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === val;
  }, 'date must be a valid calendar date');

const timeString = z
  .string()
  .trim()
  .regex(/^\d{2}:\d{2}(:\d{2})?$/, 'time must be HH:MM or HH:MM:SS');

const attendanceStatusEnum = z.enum([
  'present',
  'absent',
  'half_day',
  'leave',
  'week_off',
  'holiday',
  'on_duty',
]);

/** Same CSV / array preprocess as employee list filters. */
const csvQueryStrings = z.preprocess((val) => {
  if (val === undefined || val === null || val === '') return undefined;
  if (Array.isArray(val)) {
    return val.flatMap((entry) =>
      String(entry)
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean),
    );
  }
  return String(val)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}, z.array(z.string()).optional());

export const getDailyAttendanceSchema = z.object({
  query: z.object({
    date: isoDateString,
    search: z.string().trim().optional(),
    status: csvQueryStrings,
    shift: csvQueryStrings,
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(200).optional().default(50),
    pending_only: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => v === 'true'),
  }),
});

export const bulkMarkPresentSchema = z.object({
  body: z.object({
    date: isoDateString,
    company_member_ids: z.array(z.string().uuid()).optional(),
  }),
});

/** Mark whole company day as holiday (calendar + attendance). Overrides prior marks by default. */
export const bulkMarkHolidaySchema = z.object({
  body: z.object({
    date: isoDateString,
    name: z.string().trim().min(2).max(120),
    /** When true (default), convert already-marked present/absent/etc to holiday. */
    override_existing: z.boolean().optional().default(true),
    is_optional: z.boolean().optional().default(false),
  }),
});

/** Shared date-range query for attendance analytics endpoints. */
export const getAttendanceAnalyticsRangeSchema = z.object({
  query: z
    .object({
      from: isoDateString.optional(),
      to: isoDateString.optional(),
      /** Convenience: YYYY-MM — expands to month bounds when from/to omitted */
      month: z
        .string()
        .trim()
        .regex(/^\d{4}-\d{2}$/, 'month must be YYYY-MM')
        .optional(),
    })
    .superRefine((q, ctx) => {
      if (q.from && q.to && q.from > q.to) {
        ctx.addIssue({ code: 'custom', message: 'from must be on or before to', path: ['from'] });
      }
    })
    .transform((q) => {
      if (q.from && q.to) return { from: q.from, to: q.to };

      if (q.month) {
        const year = Number(q.month.slice(0, 4));
        const monthIndex = Number(q.month.slice(5, 7));
        const from = `${q.month}-01`;
        const last = new Date(Date.UTC(year, monthIndex, 0)).getUTCDate();
        const to = `${q.month}-${String(last).padStart(2, '0')}`;
        return { from, to };
      }

      const now = new Date();
      const y = now.getUTCFullYear();
      const m = now.getUTCMonth();
      const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
      return { from, to };
    }),
});

export const getEmployeeAttendanceMonthSchema = z.object({
  params: z.object({
    employmentId: z.string().uuid(),
  }),
  query: getAttendanceAnalyticsRangeSchema.shape.query,
});

export const updateAttendanceSchema = z.object({
  params: z.object({
    attendanceId: z.string().uuid(),
  }),
  body: z
    .object({
      work_shift_id: z.string().uuid().optional(),
      check_in: timeString.optional(),
      check_out: timeString.optional(),
      lunch_break_minutes: z.number().int().min(0).max(480).optional(),
      tea_break_minutes: z.number().int().min(0).max(240).optional(),
      status: attendanceStatusEnum.optional(),
      is_ot: z.boolean().optional(),
      ot_minutes: z.number().int().min(0).max(960).optional(),
      ot_reason: z.string().trim().max(200).nullable().optional(),
      notes: z.string().trim().max(500).nullable().optional(),
    })
    .refine((body) => Object.keys(body).length > 0, {
      message: 'At least one field must be provided',
    }),
});

export const upsertAttendanceSchema = z.object({
  body: z
    .object({
      date: isoDateString,
      company_member_id: z.string().uuid().optional(),
      employment_id: z.string().uuid().optional(),
      work_shift_id: z.string().uuid().optional(),
      check_in: timeString.optional(),
      check_out: timeString.optional(),
      lunch_break_minutes: z.number().int().min(0).max(480).optional(),
      tea_break_minutes: z.number().int().min(0).max(240).optional(),
      status: attendanceStatusEnum.optional().default('present'),
      is_ot: z.boolean().optional().default(false),
      ot_minutes: z.number().int().min(0).max(960).optional().default(0),
      ot_reason: z.string().trim().max(200).nullable().optional(),
      notes: z.string().trim().max(500).nullable().optional(),
    })
    .refine((body) => body.company_member_id || body.employment_id, {
      message: 'company_member_id or employment_id is required',
    }),
});
